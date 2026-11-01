// Local demo database.
//
// A tiny in-browser stand-in for the Firestore client SDK. It exposes the same
// function names the app already used (collection, doc, query, where, orderBy,
// limit, getDocs, getDoc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc,
// writeBatch, serverTimestamp, increment, arrayUnion, arrayRemove), so the
// screens did not need to change how they read and write data.
//
// Data lives in memory and is persisted to localStorage (300 ms debounce).
// Nothing ever leaves the browser. Other tabs of the same demo stay in sync
// through the `storage` event, so an order placed on /menu shows up live in
// /admin/pedidos.
//
// To reconnect a real backend later, point the imports in the app back to
// `firebase/firestore` and a configured `db` instance: the call sites are
// already written against that API.

import { buildSeed, SEED_VERSION } from './seed'

const STORAGE_KEY = 'menu-demo-db'
const SAVE_DEBOUNCE_MS = 300
const DAY_MS = 86400000

// ── Timestamp ────────────────────────────────────────────────────────────────

export class Timestamp {
  constructor(ms) { this._ms = ms }
  toDate() { return new Date(this._ms) }
  toMillis() { return this._ms }
  static now() { return new Timestamp(Date.now()) }
  static fromDate(date) { return new Timestamp(date.getTime()) }
  static fromMillis(ms) { return new Timestamp(ms) }
}

// ── Sentinels (resolved at write time) ───────────────────────────────────────

const SENTINEL = '__demoSentinel'
export const serverTimestamp = () => ({ [SENTINEL]: 'timestamp' })
export const increment = (n) => ({ [SENTINEL]: 'increment', n: Number(n) || 0 })
export const arrayUnion = (...items) => ({ [SENTINEL]: 'arrayUnion', items })
export const arrayRemove = (...items) => ({ [SENTINEL]: 'arrayRemove', items })

const isSentinel = (v) => v && typeof v === 'object' && SENTINEL in v

// ── Serialization ────────────────────────────────────────────────────────────

const serialize = (value) => {
  if (value instanceof Timestamp) return { __ts: value.toMillis() }
  if (value instanceof Date) return { __ts: value.getTime() }
  if (Array.isArray(value)) return value.map(serialize)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) if (v !== undefined) out[k] = serialize(v)
    return out
  }
  return value
}

const hydrate = (value) => {
  if (Array.isArray(value)) return value.map(hydrate)
  if (value && typeof value === 'object') {
    if ('__ts' in value && Object.keys(value).length === 1) return new Timestamp(value.__ts)
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = hydrate(v)
    return out
  }
  return value
}

// ── State ────────────────────────────────────────────────────────────────────

let state = null // { version, anchor, collections: { [name]: { [id]: serializedDoc } } }
let saveTimer = null
const listeners = new Set()

const startOfDay = (ms) => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const dayKey = (ms) => {
  const d = new Date(ms)
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

// Keeps the demo feeling "live": when the demo is opened on a later day, every
// stored date moves forward by the same number of days, so today always has
// activity and the charts never go empty.
const shiftDates = (snapshot, days) => {
  if (!days) return snapshot
  const delta = days * DAY_MS
  const shiftValue = (v) => {
    if (Array.isArray(v)) return v.map(shiftValue)
    if (v && typeof v === 'object') {
      if ('__ts' in v) return { __ts: v.__ts + delta }
      const out = {}
      for (const [k, val] of Object.entries(v)) out[k] = shiftValue(val)
      return out
    }
    return v
  }
  const collections = {}
  for (const [name, docs] of Object.entries(snapshot.collections)) {
    collections[name] = {}
    for (const [id, data] of Object.entries(docs)) {
      let next = shiftValue(data)
      let nextId = id
      if (name === 'register_sessions' && data.date) {
        const [y, m, d] = data.date.split('-').map(Number)
        nextId = dayKey(new Date(y, m - 1, d).getTime() + delta)
        next = {
          ...next,
          date: nextId,
          deposits: (next.deposits || []).map((e) => ({ ...e, ts: new Date(new Date(e.ts).getTime() + delta).toISOString() })),
          withdrawals: (next.withdrawals || []).map((e) => ({ ...e, ts: new Date(new Date(e.ts).getTime() + delta).toISOString() })),
        }
      }
      collections[name][nextId] = next
    }
  }
  return { ...snapshot, anchor: snapshot.anchor + delta, collections }
}

const freshState = () => ({
  version: SEED_VERSION,
  anchor: startOfDay(Date.now()),
  collections: serialize(buildSeed(Date.now())),
})

const load = () => {
  if (state) return state
  let stored = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) stored = JSON.parse(raw)
  } catch { stored = null }

  if (!stored || stored.version !== SEED_VERSION || !stored.collections) {
    state = freshState()
    persistNow()
    return state
  }

  const days = Math.round((startOfDay(Date.now()) - stored.anchor) / DAY_MS)
  state = days > 0 ? shiftDates(stored, days) : stored
  if (days > 0) persistNow()
  return state
}

function persistNow() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    // Storage full or blocked (private mode): the demo keeps working in memory.
    console.warn('No se pudo guardar el estado de la demo:', err)
  }
}

const schedulePersist = () => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(persistNow, SAVE_DEBOUNCE_MS)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return
    try {
      state = JSON.parse(e.newValue)
      notify()
    } catch { /* ignore malformed payloads */ }
  })
  // Flush a pending debounced save before the tab goes away.
  window.addEventListener('pagehide', () => { if (saveTimer) { clearTimeout(saveTimer); persistNow() } })
}

const notify = () => {
  // Listeners are invoked async, like Firestore snapshot callbacks.
  queueMicrotask(() => listeners.forEach((fn) => fn()))
}

const commit = () => {
  schedulePersist()
  notify()
}

// Restores the original sample data. Used by the "Reiniciar demo" action.
export const resetDemoData = () => {
  state = freshState()
  persistNow()
  notify()
}

// ── References ───────────────────────────────────────────────────────────────

export const db = { __demo: true }

const autoId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 10)

export const collection = (_db, name) => ({ type: 'collection', name })

export const doc = (_dbOrCol, nameOrId, maybeId) => {
  if (_dbOrCol?.type === 'collection') return { type: 'doc', col: _dbOrCol.name, id: nameOrId ?? autoId() }
  return { type: 'doc', col: nameOrId, id: maybeId }
}

export const where = (field, op, value) => ({ kind: 'where', field, op, value })
export const orderBy = (field, dir = 'asc') => ({ kind: 'orderBy', field, dir })
export const limit = (n) => ({ kind: 'limit', n })

export const query = (colRef, ...constraints) => ({
  type: 'query',
  name: colRef.name,
  constraints: [...(colRef.constraints || []), ...constraints],
})

// ── Snapshots ────────────────────────────────────────────────────────────────

const makeDocSnap = (col, id, raw) => ({
  id,
  ref: { type: 'doc', col, id },
  exists: () => raw !== undefined,
  data: () => (raw === undefined ? undefined : hydrate(structuredClone(raw))),
})

const comparable = (v) => {
  if (v && typeof v === 'object' && '__ts' in v) return v.__ts
  return v
}

const runQuery = (ref) => {
  const docs = load().collections[ref.name] || {}
  let rows = Object.entries(docs).map(([id, raw]) => ({ id, raw }))
  const constraints = ref.constraints || []

  for (const c of constraints.filter((x) => x.kind === 'where')) {
    rows = rows.filter(({ raw }) => {
      const v = comparable(raw[c.field])
      const target = comparable(serialize(c.value))
      switch (c.op) {
        case '==': return v === target
        case '!=': return v !== target
        case '>=': return v !== undefined && v >= target
        case '<=': return v !== undefined && v <= target
        case '>': return v !== undefined && v > target
        case '<': return v !== undefined && v < target
        case 'in': return Array.isArray(c.value) && c.value.includes(v)
        case 'array-contains': return Array.isArray(raw[c.field]) && raw[c.field].includes(c.value)
        default: return true
      }
    })
  }

  for (const c of constraints.filter((x) => x.kind === 'orderBy').reverse()) {
    rows = [...rows].sort((a, b) => {
      const va = comparable(a.raw[c.field])
      const vb = comparable(b.raw[c.field])
      if (va === vb) return 0
      if (va === undefined) return 1
      if (vb === undefined) return -1
      const r = va > vb ? 1 : -1
      return c.dir === 'desc' ? -r : r
    })
  }

  const lim = constraints.find((x) => x.kind === 'limit')
  if (lim) rows = rows.slice(0, lim.n)

  const snaps = rows.map(({ id, raw }) => makeDocSnap(ref.name, id, raw))
  return {
    docs: snaps,
    size: snaps.length,
    empty: snaps.length === 0,
    forEach: (fn) => snaps.forEach(fn),
  }
}

const readDoc = (ref) => makeDocSnap(ref.col, ref.id, load().collections[ref.col]?.[ref.id])

const snapshotOf = (ref) => (ref.type === 'doc' ? readDoc(ref) : runQuery(ref))

// Small artificial latency so loading states are visible but brief.
const settle = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 120))

export const getDocs = (ref) => settle(runQuery(ref.type === 'collection' ? { ...ref, constraints: [] } : ref))
export const getDoc = (ref) => settle(readDoc(ref))

export const onSnapshot = (ref, next, onError) => {
  const target = ref.type === 'collection' ? { ...ref, constraints: [] } : ref
  const emit = () => {
    try { next(snapshotOf(target)) } catch (err) { onError?.(err) }
  }
  listeners.add(emit)
  setTimeout(emit, 0)
  return () => listeners.delete(emit)
}

// ── Writes ───────────────────────────────────────────────────────────────────

const applyField = (current, incoming) => {
  if (!isSentinel(incoming)) return serialize(incoming)
  switch (incoming[SENTINEL]) {
    case 'timestamp': return { __ts: Date.now() }
    case 'increment': return (Number(current) || 0) + incoming.n
    case 'arrayUnion': {
      const base = Array.isArray(current) ? [...current] : []
      incoming.items.forEach((i) => { if (!base.includes(i)) base.push(i) })
      return base
    }
    case 'arrayRemove':
      return (Array.isArray(current) ? current : []).filter((i) => !incoming.items.includes(i))
    default: return null
  }
}

const mergeInto = (base, data) => {
  const out = { ...(base || {}) }
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    out[key] = applyField(out[key], value)
  }
  return out
}

const ensureCol = (name) => {
  const s = load()
  if (!s.collections[name]) s.collections[name] = {}
  return s.collections[name]
}

const writeSet = (ref, data, options) => {
  const col = ensureCol(ref.col)
  col[ref.id] = options?.merge ? mergeInto(col[ref.id], data) : mergeInto({}, data)
}

const writeUpdate = (ref, data) => {
  const col = ensureCol(ref.col)
  if (!col[ref.id]) throw new Error(`No existe el documento ${ref.col}/${ref.id}`)
  col[ref.id] = mergeInto(col[ref.id], data)
}

const writeDelete = (ref) => {
  const col = ensureCol(ref.col)
  delete col[ref.id]
}

export const addDoc = async (colRef, data) => {
  const ref = doc(colRef)
  writeSet(ref, data)
  commit()
  return ref
}

export const setDoc = async (ref, data, options) => {
  writeSet(ref, data, options)
  commit()
}

export const updateDoc = async (ref, data) => {
  writeUpdate(ref, data)
  commit()
}

export const deleteDoc = async (ref) => {
  writeDelete(ref)
  commit()
}

export const writeBatch = () => {
  const ops = []
  return {
    set(ref, data, options) { ops.push(() => writeSet(ref, data, options)); return this },
    update(ref, data) { ops.push(() => writeUpdate(ref, data)); return this },
    delete(ref) { ops.push(() => writeDelete(ref)); return this },
    async commit() {
      ops.forEach((op) => op())
      commit()
    },
  }
}

export const runTransaction = async (_db, fn) => {
  const tx = writeBatch()
  const result = await fn({
    get: async (ref) => readDoc(ref),
    set: (ref, data, options) => tx.set(ref, data, options),
    update: (ref, data) => tx.update(ref, data),
    delete: (ref) => tx.delete(ref),
  })
  await tx.commit()
  return result
}
