// src/lib/offlineQueue.js
// Offline-first queue for rural/low-connectivity users.
// Check-ins are saved to IndexedDB immediately and synced when the network returns.
// Each record carries a client_uuid so re-syncs are idempotent (unique index server-side).

const DB_NAME = 'gfa-vrcc-offline';
const STORE = 'checkin-queue';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'client_uuid' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueCheckin(record) {
  const db = await openDB();
  const payload = { ...record, client_uuid: record.client_uuid ?? crypto.randomUUID() };
  await new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(payload);
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
  return payload;
}

export async function drainQueue(supabase) {
  if (!navigator.onLine) return { synced: 0 };
  const db = await openDB();
  const all = await new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error);
  });
  let synced = 0;
  for (const rec of all) {
    const { error } = await supabase
      .from('daily_checkins')
      .upsert({ ...rec, offline_synced_at: new Date().toISOString() },
              { onConflict: 'client_uuid', ignoreDuplicates: true });
    if (!error || error.code === '23505') {
      await new Promise((res) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(rec.client_uuid);
        tx.oncomplete = res;
      });
      synced++;
    }
  }
  return { synced };
}

/** Call once at app boot — auto-drains whenever connectivity returns. */
export function watchConnectivity(supabase, onSynced) {
  const drain = async () => {
    const { synced } = await drainQueue(supabase);
    if (synced > 0 && onSynced) onSynced(synced);
  };
  window.addEventListener('online', drain);
  drain();
  return () => window.removeEventListener('online', drain);
}
