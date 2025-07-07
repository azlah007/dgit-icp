const fs = require('fs');
const path = require('path');

const configPath = path.join(process.cwd(), 'config.json');

function initRepo(repoName) {
  const config = { repoName, branch: 'master' };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`Initialized local dgit repo for "${repoName}"`);
}

function cloneRepo(repoName) {
  console.log(`Cloning repo "${repoName}"...`);
  // Placeholder, here you'd fetch files from canister
  initRepo(repoName);
}

function getStatus() {
  if (!fs.existsSync(configPath)) {
    console.log('Not a dgit repo. Run "dgit init <repoName>" first.');
    return;
  }
  const config = JSON.parse(fs.readFileSync(configPath));
  console.log(`Repo: ${config.repoName}`);
  console.log(`Branch: ${config.branch}`);
}

module.exports = { initRepo, cloneRepo, getStatus };
