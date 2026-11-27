// Builder / facility portal API (mounted at /api/bms). Builders see only their own projects; admins see all.
import { Router } from 'express'
import * as c from '../controllers/bms.controller.js'
import { csrfGuard, requireRole } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { validateEquipment, validateEquipmentPatch, validateHours, validateProject, validateResolve } from '../validators/bms.validator.js'

const r = Router()
r.use(csrfGuard, requireRole('builder', 'admin'))
r.get('/catalog', c.catalog)
r.get('/overview', c.overview)
r.get('/alarms', c.globalAlarms)
r.post('/projects', validate(validateProject), c.createProject)
r.get('/projects/:id', c.getProject)
r.delete('/projects/:id', c.deleteProject)
r.get('/projects/:id/equipment', c.listEquipment)
r.post('/projects/:id/equipment', validate(validateEquipment), c.addEquipment)
r.patch('/projects/:id/equipment/:eid', validate(validateEquipmentPatch), c.patchEquipment)
r.delete('/projects/:id/equipment/:eid', c.removeEquipment)
r.get('/projects/:id/live', c.live)
r.get('/projects/:id/equipment/:eid/history', validate(validateHours), c.history)
r.get('/projects/:id/alarms', c.listAlarms)
r.post('/projects/:id/alarms/:aid/ack', c.acknowledge)
r.post('/projects/:id/alarms/:aid/resolve', validate(validateResolve), c.resolve)
export default r
