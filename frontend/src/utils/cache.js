import { openDB } from 'idb';

const DB_NAME = 'musicify-cache';
const DB_VERSION = 1;
const STORE_NAME = 'previews';

/**
 * Initialize IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'trackId' });
      }
    },
  });
}

/**
 * Cache a preview audio blob
 * @param {string} trackId - Spotify track ID
 * @param {string} previewUrl - Preview URL
 * @returns {Promise<void>}
 */
export async function cachePreview(trackId, previewUrl) {
  if (!previewUrl) return;

  try {
    const db = await initDB();
    const response = await fetch(previewUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    await db.put(STORE_NAME, {
      trackId,
      blobUrl,
      cachedAt: Date.now(),
    });
  } catch (error) {
    console.error('Failed to cache preview:', error);
  }
}

/**
 * Get cached preview blob URL
 * @param {string} trackId - Spotify track ID
 * @returns {Promise<string|null>} Blob URL or null if not cached
 */
export async function getCachedPreview(trackId) {
  try {
    const db = await initDB();
    const cached = await db.get(STORE_NAME, trackId);

    if (cached) {
      // Check if cache is older than 7 days
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - cached.cachedAt < sevenDays) {
        return cached.blobUrl;
      } else {
        // Remove expired cache
        await db.delete(STORE_NAME, trackId);
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to get cached preview:', error);
    return null;
  }
}

/**
 * Clear all cached previews
 * @returns {Promise<void>}
 */
export async function clearCache() {
  try {
    const db = await initDB();
    await db.clear(STORE_NAME);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

/**
 * Get cache size (approximate)
 * @returns {Promise<number>} Number of cached items
 */
export async function getCacheSize() {
  try {
    const db = await initDB();
    return await db.count(STORE_NAME);
  } catch (error) {
    console.error('Failed to get cache size:', error);
    return 0;
  }
}

