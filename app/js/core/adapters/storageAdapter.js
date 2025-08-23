// Storage Adapter: provides a seam for localStorage with safe fallbacks

const memoryStore = new Map();

function hasLocalStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const t = '__test__';
    window.localStorage.setItem(t, '1');
    window.localStorage.removeItem(t);
    return true;
  } catch {
    return false;
  }
}

const useLocal = hasLocalStorage();

export const storage = {
  type: useLocal ? 'localStorage' : 'memory',
  getItem(key) {
    try {
      return useLocal ? window.localStorage.getItem(key) : (memoryStore.get(key) ?? null);
    } catch (e) {
      console.warn('storage.getItem failed:', e);
      return null;
    }
  },
  setItem(key, value) {
    try {
      if (useLocal) {
        window.localStorage.setItem(key, value);
      } else {
        memoryStore.set(key, value);
      }
      return true;
    } catch (e) {
      console.warn('storage.setItem failed:', e);
      return false;
    }
  },
  removeItem(key) {
    try {
      if (useLocal) {
        window.localStorage.removeItem(key);
      } else {
        memoryStore.delete(key);
      }
      return true;
    } catch (e) {
      console.warn('storage.removeItem failed:', e);
      return false;
    }
  },
  keys() {
    try {
      if (useLocal) {
        const ks = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k) ks.push(k);
        }
        return ks;
      }
      return Array.from(memoryStore.keys());
    } catch (e) {
      console.warn('storage.keys failed:', e);
      return [];
    }
  },
};

export default storage;
