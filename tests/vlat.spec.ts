import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Randomized Full VLAT (Visualization Literacy Assessment Test)' }).click();
  
  await page.getByRole('heading', { name: 'What is VLAT?' }).click();
  await page.getByRole('button', { name: 'Next' }).click();

  await page.getByPlaceholder('Your Initials').fill('test');
  await page.getByRole('button', { name: 'Next' }).click();

  const questionArray = new Array(53).fill(null);
  for (const idx of questionArray) {
    const questionText = await page.getByText('Task:');
    await expect(questionText).toBeVisible();
    const img = await page.getByRole('main').getByRole('img');
    await expect(img).toBeVisible();
    await page.locator('input[type="radio"]').nth(0).click();
    await page.getByRole('button', { name: 'Next' }).click();
  }

  await page.getByPlaceholder('Enter your answer here.').click();
  await page.getByPlaceholder('Enter your answer here.').fill('no');
  await page.getByLabel('Did anything not render or display properly? *').fill('no');
  await page.getByLabel('Any other issues or anything you would like to tell us? *').fill('no');
  await page.getByRole('button', { name: 'Next' }).click();

  await page.getByText('Thank you for completing the study. You may click this link and return to Prolif').click();
});