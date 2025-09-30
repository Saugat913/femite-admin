/**
 * Safe formatting utilities for admin panel to handle price conversion from cents to dollars
 */

/**
 * Safely formats a price in cents as currency in dollars, handling undefined/null values
 */
export function formatCurrencyFromCents(
  valueInCents: number | string | null | undefined,
  decimals: number = 2
): string {
  if (valueInCents === null || valueInCents === undefined || isNaN(Number(valueInCents))) {
    return '$0.00'
  }
  
  const numValue = typeof valueInCents === 'string' ? parseFloat(valueInCents) : valueInCents
  if (isNaN(numValue)) {
    return '$0.00'
  }
  
  // Convert from cents to dollars
  const dollarsValue = numValue / 100
  return `$${dollarsValue.toFixed(decimals)}`
}

/**
 * Safely formats a number with specified decimal places
 */
export function formatNumber(
  value: number | string | null | undefined, 
  decimals: number = 2
): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0.00'
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) {
    return '0.00'
  }
  
  return numValue.toFixed(decimals)
}

/**
 * Safely gets numeric value with fallback to 0
 */
export function safeNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(numValue) ? 0 : numValue
}