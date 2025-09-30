/**
 * Database utility functions with proper null handling
 * Helps avoid TypeScript errors for potentially undefined query results
 */

import type { QueryResult, QueryResultRow } from 'pg'

/**
 * Safe query result checker that ensures result is defined
 */
export function ensureQueryResult<T extends QueryResultRow = any>(result: QueryResult<T> | undefined, context: string): QueryResult<T> {
  if (!result) {
    throw new Error(`Database query failed: ${context} - Result is undefined`)
  }
  return result
}

/**
 * Safe row count getter
 */
export function getRowCount(result: QueryResult<QueryResultRow> | undefined): number {
  return result?.rowCount ?? 0
}

/**
 * Safe row access
 */
export function getRows<T extends QueryResultRow = any>(result: QueryResult<T> | undefined): T[] {
  return result?.rows ?? []
}

/**
 * Safe first row access
 */
export function getFirstRow<T extends QueryResultRow = any>(result: QueryResult<T> | undefined): T | null {
  const rows = getRows(result)
  return rows.length > 0 ? rows[0] : null
}

/**
 * Check if query returned any rows
 */
export function hasRows(result: QueryResult<QueryResultRow> | undefined): boolean {
  return (result?.rows?.length ?? 0) > 0
}

/**
 * Get count from a count query safely
 */
export function getCountValue(result: QueryResult<QueryResultRow> | undefined): number {
  const row = getFirstRow(result)
  return row ? parseInt(row.count || '0') : 0
}