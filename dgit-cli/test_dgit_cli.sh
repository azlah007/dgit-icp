#!/bin/bash

echo "🧪 Starting dgit CLI test..."

CLI_PATH=$(pwd)/index.js

run() {
  echo "➡️ Running: $*"
  node "$CLI_PATH" "$@"
}

# Cleanup
echo "🧹 Cleaning old test directories..."
rm -rf testrepo cloned-repo

# Create working directory
mkdir testrepo
cd testrepo || exit 1

# === Init ===
run init testrepo

# === Add and Commit a File ===
echo "console.log('Hello, dgit!');" > hello.js
run add hello.js
run commit "Initial commit"

# === Show Log ===
run log

# === Branching ===
run branch -c dev
run checkout dev

# === Modify and Commit in Dev Branch ===
echo "console.log('Changed in dev branch');" >> hello.js
run add hello.js
run commit "Dev branch changes"

# === Merge Dev into Master ===
run checkout master
run merge dev

# === Push to Backend ===
run push

# === Simulate Pull (Clean local file then pull) ===
rm hello.js
run pull

# === Go back to root and test clone ===
cd ..
mkdir cloned-repo
cd cloned-repo || exit 1

# === Clone into New Directory ===
run clone testrepo

echo "📁 Files in cloned-repo:"
ls -1

# === Validate File ===
if [[ -f hello.js ]]; then
  echo "✅ File 'hello.js' exists in cloned-repo."
else
  echo "❌ File 'hello.js' NOT found after clone."
  exit 1
fi

echo "🎉 All dgit CLI commands tested successfully!"
