import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'ColdChain_ERP_Drafts';
const STORE_NAME = 'form_drafts';

/**
 * Offline Draft Persistence Service
 * Uses IndexedDB to safeguard data entry during connectivity drops.
 */
class DraftQueue {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }

  async saveDraft(type: string, data: any) {
    const db = await this.dbPromise;
    return await db.add(STORE_NAME, {
      type,
      data,
      timestamp: Date.now(),
      synced: false
    });
  }

  async getUnsyncedDrafts() {
    const db = await this.dbPromise;
    const all = await db.getAll(STORE_NAME);
    return all.filter(d => !d.synced);
  }

  async markAsSynced(id: number) {
    const db = await this.dbPromise;
    const draft = await db.get(STORE_NAME, id);
    if (draft) {
      draft.synced = true;
      await db.put(STORE_NAME, draft);
    }
  }

  async clearSynced() {
    const db = await this.dbPromise;
    const drafts = await db.getAll(STORE_NAME);
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const d of drafts) {
      if (d.synced) {
        await tx.store.delete(d.id);
      }
    }
  }
}

export const draftQueue = new DraftQueue();
