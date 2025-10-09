export function formatCompactNumber(n: number): string {
  try {
    return Intl.NumberFormat(undefined, { notation: 'compact' }).format(n)
  } catch {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
    return String(n)
  }
}


