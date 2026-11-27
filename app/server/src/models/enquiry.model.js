// Enquiries are stored in a JSON file in the data volume (fine for a corporate site's volume).
import { read, write } from '../utils/fileStore.js'

const FILE = 'enquiries.json'
export const all = () => read(FILE, [])
export const saveAll = (list) => write(FILE, list)
