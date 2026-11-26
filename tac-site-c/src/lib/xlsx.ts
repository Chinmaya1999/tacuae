// Minimal, dependency-free .xlsx writer for the bill of quantities (one sheet; text and numbers).
import type { Pricing, Quote } from './quote'

type Cell = string | number | null
const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc32 = (b: Uint8Array) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }

/** Uncompressed ZIP container. */
function zip(files: [string, string][]) {
  const enc = new TextEncoder(), parts: Uint8Array[] = [], central: Uint8Array[] = []
  let offset = 0
  const head = (size: number, fill: (v: DataView) => void) => { const b = new Uint8Array(size); fill(new DataView(b.buffer)); return b }
  for (const [name, text] of files) {
    const n = enc.encode(name), data = enc.encode(text), crc = crc32(data)
    const common = (v: DataView, at: number) => { v.setUint16(at, 20, true); v.setUint16(at + 2, 0x0800, true); v.setUint16(at + 8, 0x21, true); v.setUint32(at + 10, crc, true); v.setUint32(at + 14, data.length, true); v.setUint32(at + 18, data.length, true); v.setUint16(at + 22, n.length, true) }
    const local = head(30, (v) => { v.setUint32(0, 0x04034b50, true); common(v, 4) })
    central.push(head(46, (v) => { v.setUint32(0, 0x02014b50, true); v.setUint16(4, 20, true); common(v, 6); v.setUint32(42, offset, true) }), n)
    parts.push(local, n, data); offset += 30 + n.length + data.length
  }
  const size = central.reduce((a, b) => a + b.length, 0)
  const end = head(22, (v) => { v.setUint32(0, 0x06054b50, true); v.setUint16(8, files.length, true); v.setUint16(10, files.length, true); v.setUint32(12, size, true); v.setUint32(16, offset, true) })
  return new Blob([...parts, ...central, end] as BlobPart[], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
const esc = (s: string) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const col = (i: number) => String.fromCharCode(65 + i)

export function workbook(sheet: string, rows: Cell[][], bold: number[] = []) {
  const body = rows.map((r, y) => `<row r="${y + 1}">${r.map((c, x) => {
    const ref = `${col(x)}${y + 1}`, s = bold.includes(y) ? 1 : typeof c === 'number' && !Number.isInteger(c) ? 2 : 0
    if (c === null || c === '') return ''
    // inline strings are never evaluated as formulas
    return typeof c === 'number' ? `<c r="${ref}" s="${s}"><v>${c}</v></c>` : `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${esc(c)}</t></is></c>`
  }).join('')}</row>`).join('')
  const x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships', main = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
  return zip([
    ['[Content_Types].xml', `${x}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
    ['_rels/.rels', `${x}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml', `${x}<workbook xmlns="${main}" xmlns:r="${rel}"><sheets><sheet name="${esc(sheet)}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', `${x}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml', `${x}<styleSheet xmlns="${main}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="3"><xf/><xf fontId="1" applyFont="1"/><xf numFmtId="4" applyNumberFormat="1"/></cellXfs></styleSheet>`],
    ['xl/worksheets/sheet1.xml', `${x}<worksheet xmlns="${main}"><cols><col min="1" max="1" width="18" customWidth="1"/><col min="2" max="2" width="44" customWidth="1"/><col min="3" max="7" width="18" customWidth="1"/></cols><sheetData>${body}</sheetData></worksheet>`],
  ])
}

export function boqRows(q: Quote): { rows: Cell[][]; bold: number[] } {
  const p: Pricing = q.pricing, aed = (f?: number) => (f === undefined ? null : f / 100)
  const rows: Cell[][] = [['Total Automation Co. LLC — Bill of Quantities'], ['Quotation', `${q.ref} v${q.version}`], ['Name', q.name], ['Status', q.indicative ? 'Indicative quotation — subject to site survey' : 'Final quotation'], []]
  const header = rows.length
  rows.push(['Category', 'Item', 'Quantity', 'Unit price (AED)', 'Accessories / unit', 'Installation / unit', 'Line total (AED)'])
  for (const l of p.lines) rows.push([l.group, l.name, l.qty, aed(l.unit), aed(l.accessory), aed(l.install), l.unit === undefined ? null : ((l.unit + (l.accessory ?? 0) + (l.install ?? 0)) * l.qty) / 100])
  rows.push([])
  const t = p.totals
  if (t) for (const [name, v] of [['Cabling allowance', t.cabling], ['Programming', t.programming], ['Commissioning', t.commissioning], ['Subtotal', t.subtotal], ['Volume discount', -t.volumeDiscount], ['Discount', -t.discount], ['AMC', t.amc], ['VAT', t.vat], ['Total (AED)', t.total]] as const) rows.push([null, name, null, null, null, null, v / 100])
  return { rows, bold: [0, header, rows.length - 1] }
}
export function downloadXlsx(q: Quote) {
  const { rows, bold } = boqRows(q), a = document.createElement('a')
  a.href = URL.createObjectURL(workbook('BOQ', rows, bold)); a.download = `${q.ref}-BOQ.xlsx`; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
