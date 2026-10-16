import { describe, expect, it } from 'vitest'
import { dedupeById, mergeMovements, shouldApplyRemote } from './sync'

describe('sync', () => {
  it('shouldApplyRemote respeita clientUpdatedAt', () => {
    expect(shouldApplyRemote('2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z')).toBe(true)
    expect(shouldApplyRemote('2026-01-03T00:00:00Z', '2026-01-02T00:00:00Z')).toBe(false)
  })

  it('dedupeById mantém último id', () => {
    expect(dedupeById([{ id: 'a' }, { id: 'a' }, { id: 'b' }])).toHaveLength(2)
  })

  it('mergeMovements remove deletados', () => {
    const merged = mergeMovements(
      [{ id: '1', clientUpdatedAt: '2026-02-01T00:00:00Z', deletedAt: '2026-02-02' }],
      [{ id: '1', clientUpdatedAt: '2026-01-01T00:00:00Z', deletedAt: null }],
    )
    expect(merged).toHaveLength(0)
  })
})
