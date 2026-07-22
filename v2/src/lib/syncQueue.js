/* Offline-first sync queue.
 *
 * Writes made while offline are stored in IndexedDB and replayed in order when
 * connectivity returns. Every queued write carries a client_ref (generated
 * once, stored with the job) and the target tables have UNIQUE(client_ref),
 * so replaying a job that already landed is a no-op — the queue is idempotent
 * even if the tab dies between the server ack and the local delete.
 */
const DB_NAME = 'vrcc-v2-sync'
const STORE = 'queue'

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const out = fn(t.objectStore(STORE))
    t.oncomplete = () => resolve(out?.result ?? out)
    t.onerror = () => reject(t.error)
  })
}

export function newClientRef() {
  return crypto.randomUUID()
}

export async function enqueue(job) {
  // job: { table, op: 'insert' | 'upsert', payload, onConflict? }
  const db = await openDb()
  await tx(db, 'readwrite', (s) => s.add({ ...job, queuedAt: Date.now() }))
}

async function listJobs() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readonly')
    const req = t.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function removeJob(id) {
  const db = await openDb()
  await tx(db, 'readwrite', (s) => s.delete(id))
}

let flushing = false

export async function flush(supabase) {
  if (flushing || !navigator.onLine) return
  flushing = true
  try {
    const jobs = await listJobs()
    for (const job of jobs.sort((a, b) => a.queuedAt - b.queuedAt)) {
      const table = supabase.from(job.table)
      const { error } =
        job.op === 'upsert'
          ? await table.upsert(job.payload, { onConflict: job.onConflict || 'client_ref' })
          : await table.insert(job.payload)
      // Duplicate client_ref means an earlier replay already landed — done.
      if (!error || error.code === '23505') {
        await removeJob(job.id)
      } else {
        break // keep order; retry this job on the next flush
      }
    }
  } finally {
    flushing = false
  }
}

/** Write through the queue: try live first, queue on failure/offline. */
export async function resilientWrite(supabase, job) {
  if (navigator.onLine) {
    const table = supabase.from(job.table)
    const { error } =
      job.op === 'upsert'
        ? await table.upsert(job.payload, { onConflict: job.onConflict || 'client_ref' })
        : await table.insert(job.payload)
    if (!error || error.code === '23505') return { queued: false }
    // RLS/validation failures shouldn't be re-queued forever
    if (error.code && error.code.startsWith('42')) throw error
    if (error.code === '42501' || error.code === '23514') throw error
  }
  await enqueue(job)
  return { queued: true }
}

export function startSyncLoop(supabase) {
  const kick = () => flush(supabase)
  window.addEventListener('online', kick)
  const interval = setInterval(kick, 30_000)
  kick()
  return () => {
    window.removeEventListener('online', kick)
    clearInterval(interval)
  }
}
