import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('foundation screens have no automated WCAG AA violations', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() =>
    localStorage.setItem('phish-tank-training-notice', 'seen'),
  );
  for (const route of ['/', '/join', '/components']) {
    await page.goto(route);
    await expect(page.locator('#page-heading')).toBeVisible();
    await expect(page.locator('#main-content')).toHaveCSS('opacity', '1');
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map(({ id, nodes }) => ({
        id,
        nodes: nodes.map(({ target, failureSummary }) => ({
          target,
          failureSummary,
        })),
      })),
    ).toEqual([]);
  }
});

test('landing loads with no runtime errors or overflow', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning')
      errors.push(message.text());
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Trust issues/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Create a room' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join a room' })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.screenshot({
    path: `test-results/landing-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test('join validates, normalizes code, saves the profile and preserves it after reload', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Join a room' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Keep it fake. Keep it fun.' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Fake passwords only. Got it.' })
    .click();
  await page.getByRole('button', { name: 'Save player profile' }).click();
  await expect(
    page.getByText('Enter all 4 letters of your room code.'),
  ).toBeVisible();
  await page.getByLabel('Room code letter 1').fill('tide');
  await expect(page.getByLabel('Room code letter 1')).toHaveValue('T');
  await expect(page.getByLabel('Room code letter 4')).toHaveValue('E');
  await page.getByLabel('Your alias').fill(' Byte Bandit ');
  await page.getByRole('button', { name: 'Choose fox avatar' }).click();
  await page.getByRole('button', { name: 'Save player profile' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Your alter ego is saved.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('dialog').getByText(/Connecting to TIDE/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Keep this identity' }).click();
  await page.reload();
  await expect(page.getByLabel('Your alias')).toHaveValue('Byte Bandit');
  await expect(
    page.getByRole('button', { name: 'Choose fox avatar' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.screenshot({
    path: `test-results/join-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test('create route saves an identity without faking a room', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a room' }).click();
  await page
    .getByRole('button', { name: 'Fake passwords only. Got it.' })
    .click();
  await expect(page.getByLabel('Room code letter 1')).toHaveCount(0);
  await page.getByLabel('Your alias').fill('Host');
  await page.getByRole('button', { name: 'Save player profile' }).click();
  await expect(
    page
      .getByRole('dialog')
      .getByText(/Creating a live room will be available in Stage 2/),
  ).toBeVisible();
});

test('room code supports individual keys, backspace, arrows and a code link', async ({
  page,
}) => {
  await page.goto('/join?code=wave');
  await page
    .getByRole('button', { name: 'Fake passwords only. Got it.' })
    .click();
  await expect(page.getByLabel('Room code letter 1')).toHaveValue('W');
  await page.getByLabel('Room code letter 1').fill('b');
  await expect(page.getByLabel('Room code letter 2')).toBeFocused();
  await page.getByLabel('Room code letter 2').fill('');
  await page.getByLabel('Room code letter 2').press('Backspace');
  await expect(page.getByLabel('Room code letter 1')).toBeFocused();
  await page.getByLabel('Room code letter 1').press('ArrowRight');
  await expect(page.getByLabel('Room code letter 2')).toBeFocused();
});

test('alias rejects markup and invalid input stays editable', async ({
  page,
}) => {
  await page.goto('/join?mode=create');
  await page
    .getByRole('button', { name: 'Fake passwords only. Got it.' })
    .click();
  await page.getByLabel('Your alias').fill('<script>');
  await page.getByRole('button', { name: 'Save player profile' }).click();
  await expect(page.getByRole('alert')).toContainText('Use letters');
  await expect(page.getByLabel('Your alias')).toBeFocused();
  await page.getByLabel('Your alias').fill('Clean Alias');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('mute preference persists across reload and navigation', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mute sound', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Unmute sound', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Unmute sound', exact: true }),
  ).toBeVisible();
});

test('modal traps focus, closes with Escape, and restores focus', async ({
  page,
}) => {
  await page.goto('/components');
  await page.getByRole('button', { name: 'Open modal', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Focus stays in the tank.' });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Close modal', exact: true })
    .focus();
  await page.keyboard.press('Tab');
  await expect(
    dialog.getByRole('button', { name: 'Close dialog' }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open modal', exact: true }),
  ).toBeFocused();
});

test('jury buttons, learning sheet and reactions are interactive', async ({
  page,
}) => {
  await page.goto('/components');
  await page.getByRole('button', { name: 'SCAM', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Demo vote recorded: SCAM' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'REAL', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: /Reset card/ }).click();
  await expect(
    page.getByRole('button', { name: 'REAL', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Open learn card' }).click();
  await expect(
    page.getByRole('dialog').getByText('Do this instead'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await page.getByRole('button', { name: 'React: Big brain' }).click();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Reaction sent in this demo: 🧠' }),
  ).toBeVisible();
});

test('timer recovers from elapsed wall time instead of counting ticks', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/components');
  await page.getByRole('button', { name: 'Restart 20 seconds' }).click();
  await page.clock.fastForward(17000);
  await expect(page.getByRole('timer')).toHaveAttribute(
    'aria-label',
    /[23] seconds remaining/,
  );
  await page.clock.fastForward(5000);
  await expect(page.getByRole('timer')).toHaveAttribute(
    'aria-label',
    '0 seconds remaining',
  );
});

test('reduced motion disables decorative animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect
    .poll(() =>
      page
        .locator('.hero-fish')
        .evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe('none');
});

test('navigation, credits and mobile carousel work', async ({ page }, info) => {
  await page.goto('/');
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Next step' }).click();
    await expect(
      page.getByRole('heading', { name: 'Be the bad influence.' }),
    ).toBeVisible();
  }
  await page.getByRole('button', { name: 'Why this matters' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Get fooled here. Not out there.' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.goto('/missing');
  await expect(page.getByRole('alert')).toContainText(
    'You’re swimming off the map.',
  );
  await page.getByRole('button', { name: 'Back to the tank' }).click();
  await expect(
    page.getByRole('heading', { name: /Trust issues/ }),
  ).toBeVisible();
});

test('health endpoint reports the actual foundation stage', async ({
  request,
}) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ status: 'ok', stage: 1 });
});
