const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /system\s*prompt/gi,
  /you\s+are\s+now/gi,
  /forget\s+(everything|all)/gi,
  /new\s+instructions?/gi,
  /\[INST\]/gi,
  /<\|system\|>/gi,
  /###\s*instruction/gi,
]

export function sanitizeUserInput(input: string): string {
  if (typeof input !== 'string') return ''

  const trimmed = input.slice(0, 2000)

  let sanitized = trimmed
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[removed]')
  }

  return sanitized
}

export function sanitizeInputsObject(
  inputs: Record<string, unknown>
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(inputs)) {
    if (typeof value === 'string') {
      result[key] = sanitizeUserInput(value)
    } else {
      result[key] = String(value ?? '').slice(0, 2000)
    }
  }
  return result
}
