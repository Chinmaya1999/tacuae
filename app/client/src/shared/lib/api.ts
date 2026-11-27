/** JSON fetch helper for the account, design and admin APIs. Throws Error(message) on failure. */
export async function api<T = any>(url: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch(url, {
    method: opts.method ?? 'GET', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'tac-admin' },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  })
  const data = await r.json().catch(() => ({}))
  if (r.status === 401 && !url.startsWith('/api/account/')) window.dispatchEvent(new Event('tac-signout'))
  if (!r.ok) throw new Error(data.error || (r.status >= 500 ? 'Server unavailable. Please try again.' : 'Request failed'))
  return data
}
