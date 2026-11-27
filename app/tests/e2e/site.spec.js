// Every page must render without script errors or content blocked by the security policy; key journeys must work.
import { expect, test } from '@playwright/test'
import { routes } from '../../client/src/shared/data/content.ts'

const watch = (page) => {
  const problems = []
  page.on('pageerror', (e) => problems.push(e.message))
  page.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) problems.push(m.text()) })
  return problems
}
async function opens(page, url) {
  await page.goto(url)
  await expect(page.locator('h1').first()).toBeVisible()
}
async function signIn(page, email) {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Demo@12345')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/(dashboard|admin)/)
}

for (const url of [...new Set([...routes.map((r) => r.path), '/login', '/register', '/design-my-home', '/project-quote', '/simulation', '/book'])]) {
  test(`public page ${url}`, async ({ page }) => {
    const problems = watch(page)
    await opens(page, url)
    expect(problems).toEqual([])
  })
}

const areas = {
  'customer@demo.tac': ['/dashboard', '/dashboard/quotations', '/dashboard/appointments', '/dashboard/profile', '/dashboard/designs', '/dashboard/quotes'],
  'builder@demo.tac': ['/dashboard', '/dashboard/projects', '/dashboard/projects/new', '/dashboard/alarms', '/dashboard/team', '/dashboard/profile'],
  'admin@demo.tac': ['/admin'],
  'sales@demo.tac': ['/admin'],
}
for (const [email, pages] of Object.entries(areas)) {
  test(`signed-in pages for ${email}`, async ({ page }) => {
    const problems = watch(page)
    await signIn(page, email)
    for (const url of pages) await opens(page, url)
    expect(problems).toEqual([])
  })
}

test('a customer edits their profile and signs out', async ({ page }) => {
  await signIn(page, 'customer@demo.tac')
  await page.goto('/dashboard/profile')
  await page.getByLabel('Full name').fill('Omar Updated')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Your profile has been saved.')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Full name')).toHaveValue('Omar Updated')
  await page.getByRole('button', { name: 'Sign out' }).first().click()
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})

test('a wrong password shows an error', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill('customer@demo.tac')
  await page.getByLabel('Password', { exact: true }).fill('not-the-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Incorrect email or password.')
})

test('sign-in validates input, switches to mobile and offers password help', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText('Enter your email address.')).toBeVisible()
  await expect(page.getByText('Enter your password.')).toBeVisible()
  await page.getByRole('button', { name: 'Forgot password?' }).click()
  await expect(page.getByRole('link', { name: /^Email / })).toHaveAttribute('href', /^mailto:/)
  await page.getByRole('tab', { name: 'Mobile' }).click()
  await page.getByLabel('Mobile number').fill('50 123 4567')
  await page.getByRole('button', { name: 'Send code' }).click()
  await expect(page.getByText('Demo code')).toBeVisible()
})

test('pages fit a phone screen without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 })
  for (const url of ['/', '/login', '/register', '/products', '/contact', '/design-my-home']) {
    await opens(page, url)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), url).toBeLessThanOrEqual(0)
  }
})

test('the smart home: rooms, voice, moods, time, weather and cameras all work', async ({ page }) => {
  test.setTimeout(180_000) // test machines draw the 3D house without a graphics card
  const problems = watch(page)
  await opens(page, '/')
  const home = page.getByRole('region', { name: 'Interactive smart home' })
  await expect(home.locator('canvas')).toBeVisible({ timeout: 45_000 })
  const feed = home.getByRole('list', { name: 'Activity feed', includeHidden: true })
  const tab = (name) => home.getByRole('tab', { name, exact: true }).click()

  await tab('Rooms')
  await home.getByRole('group', { name: 'Rooms' }).getByRole('button', { name: 'Kitchen' }).click()
  await home.getByRole('button', { name: 'Smart oven: Off', exact: true }).click()
  await expect(home.getByRole('button', { name: 'Smart oven: On', exact: true })).toBeVisible()
  await expect(home.getByText('Manual override: 1 device')).toBeVisible()
  await home.getByRole('button', { name: 'Resume automation' }).click()
  await home.getByRole('button', { name: 'Test smoke' }).click()
  await expect(home.getByRole('alert')).toContainText('smoke')
  await home.getByRole('button', { name: 'Clear' }).click()

  await home.getByRole('button', { name: 'Try voice control' }).click()
  await home.getByLabel('Command for the home').fill('Set bedroom temperature to 19 degrees')
  await home.getByRole('button', { name: 'Send command' }).click()
  await expect(home.getByRole('status', { name: 'Voice result' })).toContainText('19 degrees')

  await tab('Moods')
  await home.getByRole('button', { name: 'Movie', exact: true }).click()
  await expect(home.getByTestId('home-mode')).toHaveText('Movie mode')
  await tab('Daily routine')
  await home.getByRole('button', { name: /Away$/ }).click()
  await expect(home.getByTestId('home-clock')).toHaveText('08:30')
  await tab('Weather & more')
  await home.getByRole('button', { name: 'Rainy' }).click()
  await expect(feed).toContainText('irrigation paused')
  await home.getByRole('button', { name: 'Night', exact: true }).click()
  await expect(home.getByTestId('home-mode')).toHaveText('Sleep')
  await home.getByRole('button', { name: 'Activity history' }).click()
  await expect(feed).toBeVisible()

  for (const view of ['exterior', 'entrance', 'living', 'kitchen', 'bedroom', 'garden', 'security']) await home.getByLabel('Camera view', { exact: true }).selectOption(view)
  await home.getByRole('button', { name: 'Zoom in' }).click()
  await home.getByRole('button', { name: 'Reset view' }).click()
  await expect(home).toHaveAttribute('data-view', 'cutaway')
  expect(problems).toEqual([])
})

test('landing page: building explorer and solutions respond', async ({ page }) => {
  test.setTimeout(120_000)
  const problems = watch(page)
  await opens(page, '/')
  await page.getByRole('group', { name: 'Building type' }).getByRole('button', { name: 'Villas' }).click()
  await expect(page.getByText('Typical systems for villas')).toBeVisible()
  const lighting = page.getByRole('group', { name: 'Building systems' }).getByRole('button', { name: 'Lighting' })
  await lighting.click()
  await expect(lighting).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: /Guest Room Management/ }).click()
  await expect(page.getByRole('heading', { level: 3, name: /Guest Room Management/ })).toBeVisible()
  expect(problems).toEqual([])
})

test('design studio: a room can be walked through like a game', async ({ page }) => {
  test.setTimeout(150_000)
  const problems = watch(page)
  await signIn(page, 'customer@demo.tac')
  await page.goto('/dashboard/design/new?template=cinema')
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 45_000 })
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await expect(page.getByText('Walk up to a device').or(page.getByRole('button', { name: /Switch (on|off)/ }))).toBeVisible()
  await page.getByRole('button', { name: 'Orbit', exact: true }).click()
  await expect(page.getByRole('application', { name: 'Movement joystick' })).toHaveCount(0)
  await page.goto('/simulation')
  await page.getByRole('button', { name: 'Walk inside (game mode)' }).click()
  await expect(page.getByRole('button', { name: 'Exit walk mode' })).toBeVisible()
  expect(problems).toEqual([])
})

test('the 3D home raises no errors when leaving and returning to the page', async ({ page }) => {
  test.setTimeout(150_000)
  const problems = watch(page)
  await opens(page, '/')
  const home = page.getByRole('region', { name: 'Interactive smart home' })
  await expect(home.locator('canvas')).toBeVisible({ timeout: 45_000 })
  await home.getByRole('button', { name: 'Select Kitchen' }).click()
  await expect(home.getByRole('button', { name: 'Select Kitchen' })).toBeVisible()
  const nav = page.getByRole('navigation', { name: 'Primary' })
  for (let i = 0; i < 2; i++) {
    await nav.getByRole('link', { name: 'Contact', exact: true }).click()
    await expect(page.locator('h1')).toContainText('inquiries')
    await nav.getByRole('link', { name: 'Home', exact: true }).click()
    await expect(home.locator('canvas')).toBeVisible({ timeout: 45_000 })
  }
  expect(problems).toEqual([])
})
