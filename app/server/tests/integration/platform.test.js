// Designs, building management, enquiries, site content and the admin catalogue.
import test from 'node:test'
import assert from 'node:assert/strict'
import { skip, startApp } from '../helpers/app.js'

test('designs, building management, enquiries, content and catalogue', { skip }, async (t) => {
  const client = await startApp(t, 'platform')
  const guest = client(), admin = client(), home = client(), builder = client(), other = client()
  await admin('POST', '/account/login', { email: 'admin@test.local', password: 'admin-password-1' })
  for (const [c, email, role] of [[home, 'home@x.co', 'customer'], [builder, 'build@x.co', 'builder'], [other, 'other@x.co', 'builder']]) await c('POST', '/account/register', { name: role, email, password: 'sunny-harbor-42', role })

  await t.test('a design goes draft → submitted → quoted → accepted, privately', async () => {
    const rooms = [{ id: 'r1', type: 'living', name: 'Living', devices: [{ id: 'd1', cat: 'light', x: 10, y: 10 }] }]
    const { item } = await home('POST', '/designs', { name: 'Flat', rooms })
    await other('GET', `/designs/${item.id}`, undefined, 404)
    assert.equal((await admin('GET', '/admin/designs')).items.length, 0, 'drafts stay private')
    await home('POST', `/designs/${item.id}/submit`)
    await home('PUT', `/designs/${item.id}`, { name: 'Late edit', rooms }, 409)
    await admin('POST', `/admin/designs/${item.id}/quote`, { amount: 1200, note: 'ok' })
    assert.equal((await home('POST', `/designs/${item.id}/respond`, { accept: true })).item.status, 'accepted')
    await home('DELETE', `/designs/${item.id}`, undefined, 409)
  })

  await t.test('building projects, equipment and live data belong to their builder', async () => {
    await home('GET', '/bms/overview', undefined, 403)
    const { project } = await builder('POST', '/bms/projects', { name: 'Tower', towers: [{ floors: 3, unitsPerFloor: 2 }] })
    const url = `/bms/projects/${project.id}`
    await other('GET', url, undefined, 404)
    const { item } = await builder('POST', `${url}/equipment`, { type: 'pump', towerId: project.towers[0].id, level: 1 })
    await builder('POST', `${url}/equipment`, { type: 'pump', towerId: project.towers[0].id, level: 99 }, 400)
    await builder('PATCH', `${url}/equipment/${item.id}`, { name: 'Main pump' })
    assert.ok((await builder('GET', `${url}/live`)).items[item.id])
    assert.ok((await builder('GET', `${url}/equipment/${item.id}/history?hours=2`)).series)
    assert.ok(Array.isArray((await builder('GET', `${url}/alarms`)).items))
    assert.equal((await builder('GET', '/bms/overview')).projects.length, 1)
    await builder('DELETE', `${url}/equipment/${item.id}`)
    await builder('DELETE', url)
    await builder('GET', url, undefined, 404)
  })

  await t.test('enquiries reach only the admin, with a safe CSV export', async () => {
    await guest('POST', '/enquiry', { name: '=SUM(1)', email: 'q@x.co', message: 'Please call me about KNX', elapsed: 9000 })
    await home('GET', '/admin/enquiries', undefined, 403)
    const [first] = (await admin('GET', '/admin/enquiries')).items
    await admin('PATCH', `/admin/enquiries/${first.id}`, { status: 'contacted' })
    assert.match(await admin('GET', '/admin/enquiries.csv'), /'=SUM\(1\)/)
    await admin('DELETE', `/admin/enquiries/${first.id}`)
    assert.equal((await admin('GET', '/admin/stats')).total, 0)
  })

  await t.test('only the admin edits content and products', async () => {
    await home('PUT', '/admin/content/products/audiofy-system', { description: 'x' }, 403)
    await admin('PUT', '/admin/content/products/audiofy-system', { description: 'New text' })
    assert.equal((await guest('GET', '/content')).products['audiofy-system'], 'New text')
    await admin('POST', '/admin/products', { name: 'Test Relay', group: 'Lighting', unitPrice: 10 })
    await admin('POST', '/admin/products', { name: 'Test Relay', group: 'Lighting' }, 409)
    await admin('PUT', '/admin/products/test-relay', { imageUrl: 'javascript:alert(1)' }, 400)
    assert.ok((await home('GET', '/products')).items.some((p) => p.id === 'test-relay'))
    await guest('GET', '/products', undefined, 401)
  })
})
