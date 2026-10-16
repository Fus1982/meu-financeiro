import type { UUID } from './types'

export interface SyncQueueItem {
  id: UUID
  table: string
  operation: 'insert' | 'update' | 'delete'
  payload: Record<string, unknown>
  clientUpdatedAt: string
  retryCount: number
}

/** Evita duplicação: mesmo id + clientUpdatedAt já processado. */
export function shouldApplyRemote(
  localClientUpdatedAt: string | null,
  remoteClientUpdatedAt: string,
): boolean {
  if (!localClientUpdatedAt) return true
  return new Date(remoteClientUpdatedAt) >= new Date(localClientUpdatedAt)
}

export function dedupeById<T extends { id: UUID }>(items: T[]): T[] {
  const map = new Map<UUID, T>()
  for (const item of items) {
    map.set(item.id, item)
  }
  return [...map.values()]
}

export function mergeMovements<T extends { id: UUID; clientUpdatedAt: string; deletedAt?: string | null }>(
  local: T[],
  remote: T[],
): T[] {
  const byId = new Map<UUID, T>()
  for (const r of remote) {
    byId.set(r.id, r)
  }
  for (const l of local) {
    const existing = byId.get(l.id)
    if (!existing || shouldApplyRemote(existing.clientUpdatedAt, l.clientUpdatedAt)) {
      byId.set(l.id, l)
    }
  }
  return dedupeById([...byId.values()]).filter((m) => m.deletedAt == null)
}
