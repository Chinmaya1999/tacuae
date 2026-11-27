import * as Content from '../services/content.service.js'
import ApiResponse from '../utils/ApiResponse.js'

export function get(_req, res) { res.setHeader('Cache-Control', 'no-cache'); res.json(Content.get()) }
export function set(req, res) { Content.setDescription(req.valid.type, req.valid.slug, req.valid.text); ApiResponse.send(res) }
