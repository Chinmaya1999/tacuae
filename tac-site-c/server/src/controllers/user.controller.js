import * as Users from '../services/user.service.js'
import ApiResponse from '../utils/ApiResponse.js'

export const list = async (_req, res) => ApiResponse.send(res, { items: await Users.listUsers() })
export async function update(req, res) {
  await Users.updateUser(req.user, req.valid.id, req.valid.set)
  ApiResponse.send(res)
}
