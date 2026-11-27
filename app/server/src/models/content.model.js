// Admin-editable descriptions for products / projects (JSON file in the data volume).
import { read, write } from '../utils/fileStore.js'

const FILE = 'content.json'
export const get = () => read(FILE, { products: {}, projects: {} })
export const save = (c) => write(FILE, c)
