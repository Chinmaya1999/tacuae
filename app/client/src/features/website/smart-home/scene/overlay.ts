// Labels that follow points in the 3D house. They are ordinary page elements, moved each frame by the camera.
// (Rendering them through a second React root caused "unmount a root while rendering" errors.)
import type { Vector3 } from 'three'

export type Overlay = { anchors: Map<string, Vector3>; elements: Map<string, HTMLElement> }
export const createOverlay = (): Overlay => ({ anchors: new Map(), elements: new Map() })
