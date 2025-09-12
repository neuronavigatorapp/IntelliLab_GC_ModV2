import { OfflineStorage } from '../sync/types';

export class OfflineDatabase {
  private db: IDBDatabase | null = null;
  private dbName = 'IntelliLabGC';
  private version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for different entity types
        const stores = ['instruments', 'methods', 'qc_records', 'inventory', 'sync_metadata'];
        
        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            
            // Add indexes for common queries
            if (storeName === 'instruments') {
              store.createIndex('type', 'type', { unique: false });
              store.createIndex('status', 'status', { unique: false });
            } else if (storeName === 'qc_records') {
              store.createIndex('instrument_id', 'instrument_id', { unique: false });
              store.createIndex('status', 'status', { unique: false });
            } else if (storeName === 'inventory') {
              store.createIndex('category', 'category', { unique: false });
              store.createIndex('current_stock', 'current_stock', { unique: false });
            }
          }
        });
      };
    });
  }

  async saveEntity(storeName: string, entity: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(entity);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getEntity(storeName: string, id: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAllEntities(storeName: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteEntity(storeName: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async queryEntities(storeName: string, indexName: string, value: any): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveSyncCursor(cursor: any): Promise<void> {
    await this.saveEntity('sync_metadata', {
      id: 'sync_cursor',
      ...cursor
    });
  }

  async getSyncCursor(): Promise<any> {
    return await this.getEntity('sync_metadata', 'sync_cursor');
  }

  async clearStore(storeName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async exportData(): Promise<OfflineStorage> {
    const instruments = await this.getAllEntities('instruments');
    const methods = await this.getAllEntities('methods');
    const qc_records = await this.getAllEntities('qc_records');
    const inventory = await this.getAllEntities('inventory');
    const sync_cursor = await this.getSyncCursor() || { entities: {} };

    return {
      instruments,
      methods,
      qc_records,
      inventory,
      sync_cursor,
      queued_mutations: [] // This comes from mutation queue
    };
  }

  async importData(data: OfflineStorage): Promise<void> {
    // Clear existing data
    await this.clearStore('instruments');
    await this.clearStore('methods');
    await this.clearStore('qc_records');
    await this.clearStore('inventory');

    // Import new data
    for (const instrument of data.instruments) {
      await this.saveEntity('instruments', instrument);
    }

    for (const method of data.methods) {
      await this.saveEntity('methods', method);
    }

    for (const qcRecord of data.qc_records) {
      await this.saveEntity('qc_records', qcRecord);
    }

    for (const inventoryItem of data.inventory) {
      await this.saveEntity('inventory', inventoryItem);
    }

    if (data.sync_cursor) {
      await this.saveSyncCursor(data.sync_cursor);
    }
  }

  async getStorageInfo(): Promise<{
    totalSize: number;
    storeSizes: Record<string, number>;
  }> {
    const storeSizes: Record<string, number> = {};
    let totalSize = 0;

    const stores = ['instruments', 'methods', 'qc_records', 'inventory'];
    
    for (const storeName of stores) {
      const entities = await this.getAllEntities(storeName);
      storeSizes[storeName] = entities.length;
      totalSize += entities.length;
    }

    return { totalSize, storeSizes };
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Global instance
export const offlineDB = new OfflineDatabase();
