import { rid, type HomeInput, type RoomInput } from './quote'

export const HOME_DRAFT = 'tac-home-draft'
export const DRAFT_EVENT = 'tac-home-draft-changed'
const room = (type: string, name: string): RoomInput => ({ id: rid(), type, name, adjustments: {} })
export type HomeDraft = { step: number; input: HomeInput }
export const blankHome = (): HomeDraft => ({
  step: 0,
  input: { homeType: 'apartment-2', areaSqft: 0, build: 'new', connectivity: 'wired', rooms: [room('living', 'Living room'), room('master', 'Master bedroom')], levels: { lighting: 'comfort' }, control: 'app', emirate: 'Dubai', community: '', timeline: '', amc: false },
})
export function readHomeDraft(): HomeDraft {
  try { const s = localStorage.getItem(HOME_DRAFT); if (s) return JSON.parse(s) } catch { /* start fresh */ }
  return blankHome()
}
/** Used by the assistant: saves the draft and tells an open configurator to reload it. */
export function writeHomeDraft(d: HomeDraft) {
  try { localStorage.setItem(HOME_DRAFT, JSON.stringify(d)) } catch { /* private mode */ }
  window.dispatchEvent(new Event(DRAFT_EVENT))
}
