const { test, expect } = require('@playwright/test');

test('Load editor and commit a file', async ({ page }) => {
  // Go to your local frontend (update port if needed)
  await page.goto('http://localhost:3000');

  // Wait for the Monaco editor to appear
  await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

  // Wait for branch selector to stabilize the page
  await expect(page.locator('select')).toBeVisible();

  // Select the first file in the file tree (requires .file-tree-item class)
  const fileListItem = page.locator('.file-tree-item').first();
  await fileListItem.click();

  // Wait for file content to load (editor becomes editable)
  const editor = page.locator('.monaco-editor');
  await editor.click();

  // Type code into the editor
  await page.keyboard.type('actor {};');

  // Fill commit message input
  const commitInput = page.locator('input[placeholder="Commit message"]');
  await commitInput.fill('Initial commit from test');

  // Click the Commit button
  const commitButton = page.locator('button', { hasText: 'Commit' });
  await commitButton.click();

  // Wait for commit history to update
  await expect(page.locator('text=Initial commit from test')).toBeVisible({ timeout: 10000 });
});
