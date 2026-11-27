// Accounts: registration, sessions, passwords, profile, and the Google / mobile account rules.
import test from 'node:test'
import assert from 'node:assert/strict'
import { skip, startApp } from '../helpers/app.js'

test('accounts, profile, Google and mobile sign-in rules', { skip }, async (t) => {
  const client = await startApp(t, 'accounts')
  const Auth = await import('../../src/services/auth.service.js')
  const ann = client(), admin = client()
  const reg = { name: 'Ann', email: 'ann@x.co', password: 'sunny-harbor-42', role: 'admin' }

  await t.test('registration never grants staff roles and rejects duplicates', async () => {
    assert.equal((await ann('POST', '/account/register', reg)).user.role, 'customer')
    await client()('POST', '/account/register', reg, 409)
  })
  await t.test('sign-in checks the password', async () => {
    await client()('POST', '/account/login', { email: 'ann@x.co', password: 'wrong-password' }, 401)
    await client()('POST', '/account/login', { email: 'ann@x.co', password: reg.password })
  })
  await t.test('profile changes only allowed fields', async () => {
    const { user } = await ann('PATCH', '/account/profile', { name: 'Ann Lee', phone: '050 123 4567', role: 'admin', email: 'evil@x.co' })
    assert.deepEqual([user.name, user.role, user.email], ['Ann Lee', 'customer', 'ann@x.co'])
    await client()('PATCH', '/account/profile', { name: 'Nobody' }, 401)
  })
  await t.test('changing the password ends other sessions', async () => {
    const other = client(); await other('POST', '/account/login', { email: 'ann@x.co', password: reg.password })
    await ann('POST', '/account/password', { current: 'nope-nope-nope', next: 'quiet-river-77' }, 400)
    await ann('POST', '/account/password', { current: reg.password, next: 'quiet-river-77' })
    assert.equal((await other('GET', '/account/me')).user, null)
    assert.ok((await ann('GET', '/account/me')).user)
  })
  await t.test('disabling an account ends its session', async () => {
    await admin('POST', '/account/login', { email: 'admin@test.local', password: 'admin-password-1' })
    const { user } = await ann('GET', '/account/me')
    await admin('PATCH', `/admin/users/${user.id}`, { active: false })
    assert.equal((await ann('GET', '/account/me')).user, null)
  })
  await t.test('Google sign-in creates, links safely and protects staff', async () => {
    const claims = (sub, email) => ({ sub, email, name: 'G' })
    assert.equal((await Auth.googleSignIn(claims('1', 'new@gmail.com'), 'builder')).verified, false)
    await Auth.register({ name: 'L', email: 'link@gmail.com', password: 'sunny-harbor-42', role: 'customer' })
    await Auth.googleSignIn(claims('2', 'link@gmail.com'), 'customer')
    await assert.rejects(Auth.login('link@gmail.com', 'sunny-harbor-42'), { status: 401 })
    await Auth.register({ name: 'C', email: 'c@corp.com', password: 'sunny-harbor-42', role: 'customer' })
    await assert.rejects(Auth.googleSignIn(claims('3', 'c@corp.com'), 'customer'), { status: 409 })
    await assert.rejects(Auth.googleSignIn(claims('4', 'admin@test.local'), 'customer'), { status: 403 })
  })
  await t.test('mobile sign-in trusts only verified numbers', async () => {
    assert.equal(await Auth.phoneSignIn('+919000000001', { role: 'customer' }), null)
    const made = await Auth.phoneSignIn('+919000000001', { name: 'P', email: 'p@x.co', role: 'customer' })
    assert.equal((await Auth.phoneSignIn('+919000000001', {})).email, made.email)
    await assert.rejects(Auth.phoneSignIn('+919000000002', { name: 'E', email: 'p@x.co', role: 'customer' }), { status: 409 })
    const other = await Auth.register({ name: 'O', email: 'o@x.co', password: 'sunny-harbor-42', role: 'customer' })
    await assert.rejects(Auth.linkPhone(other, '+919000000001'), { status: 409 })
  })
})
