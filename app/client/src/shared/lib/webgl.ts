// Browsers allow only a handful of live WebGL contexts, so support is tested ONCE and the test context released.
let supported: boolean | null = null
export function hasWebGL(): boolean {
  if (supported === null) {
    try {
      const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl')
      supported = !!gl
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch { supported = false }
  }
  return supported
}
