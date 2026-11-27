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
