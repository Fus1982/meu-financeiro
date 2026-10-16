/** Valores monetários em centavos (inteiros) para evitar erro de ponto flutuante. */

export type Cents = number

export function reaisToCents(value: string | number): Cents {
  if (typeof value === 'number') {
    return Math.round(value * 100)
  }
  const normalized = value.trim().replace(/\./g, '').replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  if (Number.isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}

export function centsToReais(cents: Cents): number {
  return cents / 100
}

export function formatBRL(cents: Cents): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centsToReais(cents))
}

export function parseBRLInput(input: string): Cents {
  return reaisToCents(input)
}

export function addCents(...values: Cents[]): Cents {
  return values.reduce((a, b) => a + b, 0)
}

export function subtractCents(a: Cents, b: Cents): Cents {
  return a - b
}
