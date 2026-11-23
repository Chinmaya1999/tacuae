/** One CSV cell; a leading = + - @ is escaped so spreadsheets never run it as a formula. */
export const csvCell = (v) => {
  let s = String(v ?? '')
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return `"${s.replace(/"/g, '""')}"`
}
export const toCsv = (cols, rows) => '﻿' + [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\r\n')
