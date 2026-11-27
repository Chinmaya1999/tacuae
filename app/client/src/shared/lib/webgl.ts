// Browsers allow only a handful of live WebGL contexts, so support is tested ONCE and the test context released.
let supported: boolean | null = null
let software = false
/** True when 3D is drawn by the processor (no graphics card): scenes should render less often. */
export const isSoftwareGL = () => hasWebGL() && software
export function hasWebGL(): boolean {
  if (supported === null) {
    try {
      const c = document.createElement('canvas'), gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
      supported = !!gl
      const info = gl?.getExtension('WEBGL_debug_renderer_info')
      software = Boolean(info && /swiftshader|llvmpipe|software/i.test(String(gl!.getParameter(info.UNMASKED_RENDERER_WEBGL))))
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch { supported = false }
  }
  return supported
}
