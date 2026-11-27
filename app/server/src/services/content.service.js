import * as Content from '../models/content.model.js'

export const get = () => Content.get()
export function setDescription(type, slug, text) {
  const c = Content.get(); c[type] ||= {}
  if (text) c[type][slug] = text; else delete c[type][slug]
  Content.save(c)
}
