import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function setup(page: Page, name: string, code?: string) {
  await page.addInitScript(() =>
    localStorage.setItem('phish-tank-training-notice', 'seen'),
  );
  await page.goto(code ? `/join?code=${code}` : '/join?mode=create');
  await page.getByLabel('Your alias').fill(name);
  await page
    .getByRole('button', {
      name: code ? 'Join room' : 'Create room',
      exact: true,
    })
    .click();
  await expect(page.getByTestId('room-code')).toBeVisible();
  return (await page.getByTestId('room-code').innerText()).trim();
}
test('three browsers and Big Screen share membership, settings, readiness and reactions', async ({
  page,
  browser,
}) => {
  test.setTimeout(60000);
  const contexts = await Promise.all([
    browser.newContext({ baseURL: 'http://127.0.0.1:5273' }),
    browser.newContext({ baseURL: 'http://127.0.0.1:5273' }),
    browser.newContext({ baseURL: 'http://127.0.0.1:5273' }),
  ]);
  const [guest, third, screen] = await Promise.all(
    contexts.map((context) => context.newPage()),
  );
  try {
    const code = await setup(page, 'Byte Bandit');
    await setup(guest!, 'Byte Bandit', code);
    await setup(third!, 'Third Wheel', code);
    await screen!.goto(`/screen/${code}`);
    await expect(
      screen!.getByRole('heading', { name: 'Byte Bandit 2', exact: true }),
    ).toBeVisible();
    await expect(
      guest!.getByRole('button', { name: 'Hard', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: '3 rounds', exact: true }).click();
    await page.getByRole('button', { name: 'Hard', exact: true }).click();
    await expect(
      guest!.getByRole('button', { name: 'Hard', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(screen!.getByText('3 ROUNDS', { exact: true })).toBeVisible();
    await page.getByRole('switch', { name: 'Room sounds' }).click();
    await expect(
      guest!.getByRole('switch', { name: 'Room sounds' }),
    ).toHaveAttribute('aria-checked', 'false');
    for (const player of [page, guest!, third!])
      await player.getByRole('button', { name: 'I’m ready' }).click();
    await expect(
      page.getByText('Your crew is ready.', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Start game' }),
    ).toBeDisabled();
    await expect(
      screen!.getByRole('button', { name: 'I’m ready' }),
    ).toHaveCount(0);
    await expect(screen!.locator('.player-tile')).toHaveCount(3);
    await guest!.getByRole('button', { name: 'React: Fire' }).click();
    await expect(screen!.locator('.emoji-rain')).toContainText('🔥');
    await expect(page.getByText('SYNCED', { exact: false })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: `test-results/lobby-${test.info().project.name}.png`,
      fullPage: true,
    });
    await screen!.screenshot({
      path: `test-results/screen-${test.info().project.name}.png`,
      fullPage: true,
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      axe.violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});
test('refresh restores the same player and ready state without duplicating the seat', async ({
  page,
}) => {
  await setup(page, 'Remember Me');
  const id = await page.locator('.player-tile').getAttribute('data-player-id');
  await page.getByRole('button', { name: 'I’m ready' }).click();
  await page.reload();
  await expect(page.locator('.player-tile')).toHaveCount(1);
  await expect(page.locator('.player-tile')).toHaveAttribute(
    'data-player-id',
    id!,
  );
  await expect(
    page.getByRole('button', { name: 'Not ready yet' }),
  ).toBeVisible();
});
test('leaving host transfers controls and spectator reactions do not count as players', async ({
  page,
  browser,
}) => {
  const guestContext = await browser.newContext({
    baseURL: 'http://127.0.0.1:5273',
  });
  const watchContext = await browser.newContext({
    baseURL: 'http://127.0.0.1:5273',
  });
  const guest = await guestContext.newPage();
  const watcher = await watchContext.newPage();
  try {
    const code = await setup(page, 'Original Host');
    await setup(guest, 'Next Host', code);
    await watcher.goto(`/watch/${code}`);
    await expect(watcher.getByText('SPECTATOR · LIVE')).toBeVisible();
    await expect(
      watcher.getByRole('button', { name: 'I’m ready' }),
    ).toHaveCount(0);
    await expect(watcher.locator('.player-tile')).toHaveCount(2);
    await page.getByRole('button', { name: 'Leave room', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Leave room' })
      .click();
    await expect(
      guest.getByRole('button', { name: 'Hard', exact: true }),
    ).toBeEnabled();
    await expect(guest.locator('.player-tile')).toHaveCount(1);
    await watcher.getByRole('button', { name: 'React: Big brain' }).click();
    await expect(guest.locator('.emoji-rain')).toContainText('🧠');
  } finally {
    await guestContext.close();
    await watchContext.close();
  }
});
test('a second tab takes over its own session without deleting the new tab’s credentials', async ({
  page,
}) => {
  const code = await setup(page, 'One Identity');
  const other = await page.context().newPage();
  try {
    await other.goto(`/room/${code}`);
    await expect(
      other.getByRole('heading', { name: 'One Identity', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('You’ve moved tanks.')).toBeVisible();
    await other.reload();
    await expect(other.locator('.player-tile')).toHaveCount(1);
    await expect(
      other.getByRole('heading', { name: 'One Identity', exact: true }),
    ).toBeVisible();
  } finally {
    await other.close();
  }
});
test('restart or expired token shows a recoverable room-expired page', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'phish-tank-session:same-origin',
      JSON.stringify({
        code: 'ZZZZ',
        playerId: '00000000-0000-4000-8000-000000000001',
        token: 'x'.repeat(43),
      }),
    ),
  );
  await page.goto('/room/ZZZZ');
  await expect(page.getByText('Room expired, start a new one.')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Create a new room' }),
  ).toBeVisible();
});
test('disconnecting and reconnecting a player shows presence and retains identity', async ({
  page,
  browser,
}) => {
  test.setTimeout(60000);
  const otherContext = await browser.newContext({
    baseURL: 'http://127.0.0.1:5273',
  });
  const other = await otherContext.newPage();
  try {
    const code = await setup(page, 'Reconnect Me');
    await setup(other, 'Still Here', code);
    const id = await page
      .locator('.player-tile')
      .filter({
        has: page.getByRole('heading', { name: 'Reconnect Me', exact: true }),
      })
      .getAttribute('data-player-id');
    await page.context().setOffline(true);
    await expect(
      page.getByText(/Connection lost. Reconnecting automatically/),
    ).toBeVisible({ timeout: 25000 });
    await expect(
      other.getByRole('button', { name: 'Hard', exact: true }),
    ).toBeEnabled({ timeout: 25000 });
    await page.context().setOffline(false);
    await expect(page.getByRole('button', { name: 'I’m ready' })).toBeEnabled({
      timeout: 15000,
    });
    await expect(page.locator(`[data-player-id="${id}"]`)).toBeVisible();
    await expect(page.locator('.player-tile')).toHaveCount(2);
  } finally {
    await page.context().setOffline(false);
    await otherContext.close();
  }
});
