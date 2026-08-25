const KNOWN_DEPARTMENT_NAMES: Array<[RegExp, string]> = [
  [/^Direcci(?:\\00F3|F3|\?\?|@)n de Tecnolog(?:\\00ED|ED|\?\?|@)a de la Informaci(?:\\00F3|F3|\?\?|@)n$/i, 'Dirección de Tecnología de la Información'],
  [/^Secretar(?:\\00ED|ED|\?\?|@)a General$/i, 'Secretaría General'],
  [/^Tesorer(?:\\00ED|ED|\?\?|@)a Municipal$/i, 'Tesorería Municipal'],
]

export function repairLegacyText(value: string): string {
  let repaired = value
  for (const [pattern, replacement] of KNOWN_DEPARTMENT_NAMES) repaired = repaired.replace(pattern, replacement)
  repaired = repaired
    .replace(/\\00([0-9a-f]{2})/gi, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/\\u([0-9a-f]{4})/gi, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/\\x([0-9a-f]{2})/gi, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/\u0000/g, '')
  if (/[ÃÂ]/.test(repaired)) {
    const candidate = Buffer.from(repaired, 'latin1').toString('utf8')
    if (!candidate.includes('\uFFFD')) repaired = candidate
  }
  return repaired.normalize('NFC')
}

export function normalizeComparableText(value: string): string {
  return repairLegacyText(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('es')
}
