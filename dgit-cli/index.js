#!/usr/bin/env node
import { dgit } from './agent.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DGIT_DIR = path.join(process.cwd(), '.dgit');
const CONFIG_FILE = path.join(DGIT_DIR, 'config.json');
const COMMITS_FILE = path.join(DGIT_DIR, 'commits.json');
const STAGED_FILE = path.join(DGIT_DIR, 'staged.json');

const [,, cmd, ...args] = process.argv;

(async () => {
  switch (cmd) {
    case 'init': initRepo(args[0]); break;
    case 'clone': await cloneRepo(args[0]); break;
    case 'status': showStatus(); break;
    case 'add': stageFile(args[0]); break;
    case 'delete': deleteFile(args[0]); break;
    case 'commit': commitChanges(args.join(' ')); break;
    case 'log': showLog(); break;
    case 'branch': handleBranch(args); break;
    case 'checkout': checkoutBranch(args[0]); break;
    case 'merge': mergeBranch(args[0]); break;
    case 'push': await pushChanges(); break;
    case 'pull': await pullChanges(); break;
    default: showHelp();
  }
})();

// -------------------- Commands --------------------

function initRepo(repoName) {
  if (!repoName) return console.error('❌ Please provide a repo name.');
  if (fs.existsSync(DGIT_DIR)) return console.error('⚠️ Repo already initialized here.');

  fs.mkdirSync(DGIT_DIR);
  writeConfig({ repoName, currentBranch: 'master', branches: ['master'] });
  writeCommits({});
  writeStaged([]);
  console.log(`✅ Initialized new repo: ${repoName}`);
}

async function cloneRepo(repoName) {
  if (!repoName) return console.error('❌ Please specify a repo name to clone.');
  if (fs.existsSync(DGIT_DIR)) return console.error('⚠️ Repo already initialized here.');

  console.log(`⬇️ Cloning repo '${repoName}' from canister...`);

  try {
    const files = await dgit.listFiles(repoName);
    if (!files?.length) return console.error(`❌ No files found for repo '${repoName}'.`);

    fs.mkdirSync(DGIT_DIR);
    writeConfig({ repoName, currentBranch: 'master', branches: ['master'] });
    writeCommits({});
    writeStaged([]);

    for (const fileName of files) {
      const content = await dgit.getFileContent(repoName, 'master', fileName);
      fs.writeFileSync(path.join(process.cwd(), fileName), content);
      console.log(`✅ Cloned file: ${fileName}`);
    }

    console.log(`✅ Clone complete. Repo '${repoName}' is ready.`);
  } catch (err) {
    console.error('❌ Clone failed:', err);
  }
}

function showStatus() {
  if (!checkRepo()) return console.error('⚠️ Not a dgit repo.');
  const { repoName, currentBranch } = readConfig();
  const staged = readStaged();

  console.log(`\n📂 Repo: ${repoName}`);
  console.log(`🌿 Current branch: ${currentBranch}`);
  console.log(`📝 Staged files:`);
  staged.length ? staged.forEach(f => console.log(`  - ${f}`)) : console.log('  (none)');
}

function stageFile(fileName) {
  if (!checkRepo() || !fileName) return console.error('❌ Specify a file to add.');
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return console.error(`❌ File "${fileName}" does not exist.`);

  const staged = readStaged();
  if (staged.includes(fileName)) return console.log(`⚠️ File "${fileName}" already staged.`);
  staged.push(fileName);
  writeStaged(staged);
  console.log(`✅ Staged file: ${fileName}`);
}

function deleteFile(fileName) {
  if (!checkRepo() || !fileName) return console.error('❌ Specify a file to delete.');
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return console.error(`❌ File "${fileName}" does not exist.`);

  fs.unlinkSync(filePath);
  console.log(`🗑️ Deleted file: ${fileName}`);

  const staged = readStaged().filter(f => f !== fileName);
  writeStaged(staged);
}

function commitChanges(message) {
  if (!checkRepo()) return;
  if (!message?.trim()) return console.error('❌ Commit message required.');
  const staged = readStaged();
  if (!staged.length) return console.log('⚠️ No files staged.');

  const config = readConfig();
  const commits = readCommits();
  const branchCommits = commits[config.currentBranch] || [];

  const files = {};
  for (const f of staged) {
    files[f] = fs.readFileSync(path.join(process.cwd(), f), 'utf-8');
  }

  const commit = {
    id: generateCommitId(),
    message,
    timestamp: new Date().toISOString(),
    files
  };

  branchCommits.push(commit);
  commits[config.currentBranch] = branchCommits;
  writeCommits(commits);
  writeStaged([]);
  console.log(`✅ Commit created: ${commit.id} - "${message}"`);
}

function showLog() {
  if (!checkRepo()) return;
  const config = readConfig();
  const commits = readCommits();
  const branchCommits = commits[config.currentBranch] || [];

  console.log(`\n🕒 Commit history for '${config.currentBranch}':`);
  branchCommits.length
    ? branchCommits.slice().reverse().forEach(c =>
        console.log(`- ${c.id} | ${c.timestamp} | ${c.message}`))
    : console.log('  (no commits)');
}

function handleBranch(args) {
  if (!checkRepo()) return;
  if (!args.length) return listBranches();
  if (args[0] === '-c' && args[1]) return createBranch(args[1]);
  console.log('Usage:\n  dgit branch           List branches\n  dgit branch -c <name>  Create branch');
}

function listBranches() {
  const { branches, currentBranch } = readConfig();
  console.log('\n🌿 Branches:');
  branches.forEach(b => console.log(`${b === currentBranch ? '* ' : '  '}${b}`));
}

function createBranch(branchName) {
  const config = readConfig();
  if (config.branches.includes(branchName)) return console.error(`❌ Branch '${branchName}' exists.`);
  config.branches.push(branchName);

  const commits = readCommits();
  commits[branchName] = [...(commits[config.currentBranch] || [])];

  writeConfig(config);
  writeCommits(commits);
  console.log(`✅ Created new branch: ${branchName}`);
}

function checkoutBranch(branchName) {
  if (!checkRepo() || !branchName) return console.error('❌ Specify a branch to checkout.');
  const config = readConfig();
  if (!config.branches.includes(branchName)) return console.error(`❌ Branch '${branchName}' does not exist.`);
  config.currentBranch = branchName;
  writeConfig(config);
  console.log(`✅ Switched to branch '${branchName}'`);
}

function mergeBranch(sourceBranch) {
  if (!checkRepo() || !sourceBranch) return console.error('❌ Specify a branch to merge.');
  const config = readConfig();
  const commits = readCommits();

  if (!config.branches.includes(sourceBranch)) return console.error(`❌ Branch '${sourceBranch}' does not exist.`);
  if (sourceBranch === config.currentBranch) return console.error('⚠️ Cannot merge branch into itself.');

  const currentCommits = commits[config.currentBranch] || [];
  const sourceCommits = commits[sourceBranch] || [];
  commits[config.currentBranch] = [...currentCommits, ...sourceCommits];
  writeCommits(commits);

  console.log(`🔀 Merged '${sourceBranch}' into '${config.currentBranch}'`);
}

async function pushChanges() {
  if (!checkRepo()) return;
  const config = readConfig();
  const commits = readCommits();
  const branchCommits = commits[config.currentBranch] || [];
  if (!branchCommits.length) return console.log('⚠️ No commits to push.');

  console.log(`🚀 Pushing ${branchCommits.length} commit(s) to canister...`);
  try {
    for (const commit of branchCommits) {
      await dgit.commitCode(config.repoName, config.currentBranch, Object.entries(commit.files), commit.message, 'cli-user');
      console.log(`✅ Pushed commit: ${commit.id}`);
    }
    writeCommits({ ...commits, [config.currentBranch]: [] });
    console.log('✅ Push complete.');
  } catch (err) {
    console.error('❌ Push failed:', err);
  }
}

async function pullChanges() {
  if (!checkRepo()) return;
  const config = readConfig();

  console.log(`⬇️ Pulling latest files from canister for '${config.currentBranch}'...`);
  try {
    const files = await dgit.listFiles(config.repoName);
    if (!files?.length) return console.log('ℹ️ No files found on remote.');

    for (const f of files) {
      const content = await dgit.getFileContent(config.repoName, config.currentBranch, f);
      fs.writeFileSync(path.join(process.cwd(), f), content);
      console.log(`✅ Pulled file: ${f}`);
    }
    writeCommits({});
    writeStaged([]);
    console.log('✅ Pull complete.');
  } catch (err) {
    console.error('❌ Pull failed:', err);
  }
}

function showHelp() {
  console.log(`
Usage:
  dgit init <repoName>           Initialize a new repo
  dgit clone <repoName>          Clone repo from canister
  dgit status                    Show repo status
  dgit add <file>                Stage file
  dgit delete <file>             Delete file
  dgit commit <message>          Commit staged files
  dgit log                       Show commit history
  dgit branch                    List branches
  dgit branch -c <name>          Create branch
  dgit checkout <branch>         Switch branch
  dgit merge <branch>            Merge branch into current
  dgit push                      Push commits to canister
  dgit pull                      Pull latest from canister
`);
}

// -------------------- Helpers --------------------

function readConfig() {
  if (!fs.existsSync(CONFIG_FILE)) throw new Error('⚠️ Not a dgit repo.');
  return JSON.parse(fs.readFileSync(CONFIG_FILE));
}

function writeConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function readCommits() {
  return fs.existsSync(COMMITS_FILE) ? JSON.parse(fs.readFileSync(COMMITS_FILE)) : {};
}

function writeCommits(commits) {
  fs.writeFileSync(COMMITS_FILE, JSON.stringify(commits, null, 2));
}

function readStaged() {
  return fs.existsSync(STAGED_FILE) ? JSON.parse(fs.readFileSync(STAGED_FILE)) : [];
}

function writeStaged(staged) {
  fs.writeFileSync(STAGED_FILE, JSON.stringify(staged, null, 2));
}

function checkRepo() {
  return fs.existsSync(DGIT_DIR) && fs.existsSync(CONFIG_FILE);
}

function generateCommitId() {
  return Math.random().toString(36).substr(2, 7);
}
