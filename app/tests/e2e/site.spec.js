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
  await page.getByRole('button', { name: 'Sign in' }).click()
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
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert')).toContainText('Incorrect email or password.')
})
