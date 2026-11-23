/** An error whose message is safe to show to the client. */
export default class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; this.name = 'ApiError' }
}
