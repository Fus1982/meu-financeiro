import { localDb } from './localDb'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import type { SyncQueueItem } from '../domain/sync'

export async function enqueueSync(item: Omit<SyncQueueItem, 'retryCount'>) {
  await localDb.syncQueue.put({ ...item, retryCount: 0 })
}

export async function getPendingSyncCount(): Promise<number> {
  return localDb.syncQueue.count()
}

export async function flushSyncQueue(userId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: true }
  }
  const items = await localDb.syncQueue.orderBy('clientUpdatedAt').toArray()
  for (const item of items) {
    try {
      const table = item.table
      const payload = { ...item.payload, user_id: userId }
      if (item.operation === 'delete') {
        const { error } = await supabase.from(table).delete().eq('id', item.id)
        if (error) throw error
      } else if (item.operation === 'insert') {
        const { error } = await supabase.from(table).upsert(payload)
        if (error) throw error
      } else {
        const { error } = await supabase.from(table).upsert(payload)
        if (error) throw error
      }
      await localDb.syncQueue.delete(item.id)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro de sincronização'
      await localDb.syncQueue.update(item.id, { retryCount: item.retryCount + 1 })
      return { ok: false, error: message }
    }
  }
  return { ok: true }
}

export function setupOnlineSync(userId: string, onStatus: (pending: number) => void) {
  const run = async () => {
    if (!navigator.onLine) return
    await flushSyncQueue(userId)
    onStatus(await getPendingSyncCount())
  }
  window.addEventListener('online', run)
  const interval = window.setInterval(run, 60_000)
  void run()
  return () => {
    window.removeEventListener('online', run)
    window.clearInterval(interval)
  }
}
