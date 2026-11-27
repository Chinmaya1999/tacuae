/** Consistent success envelope: { ok: true, ...data }. */
export default class ApiResponse {
  static send(res, data = {}, status = 200) { return res.status(status).json({ ok: true, ...data }) }
}
