function isJsonString(str) {
  if (typeof str !== 'string') return false;
  try {
    const obj = JSON.parse(str);
    return typeof obj === 'object' && obj !== null;
  } catch (e) {
    return false;
  }
}

export const localStorageHealthCheck = async () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      try {
        const value = window.localStorage.getItem(key);
        if (value && !isJsonString(value)) {
          // Keep string items or remove corrupt JSON
        }
      } catch (e) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        void e;
      }
    }
  } catch (error) {
    console.error('localStorage health check error:', error);
  }
};

export const storePersist = {
  set: (key, state) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Failed to write key "${key}" to localStorage:`, error);
    }
  },
  get: (key) => {
    try {
      const result = window.localStorage.getItem(key);
      if (!result) return false;
      if (!isJsonString(result)) {
        window.localStorage.removeItem(key);
        return false;
      }
      return JSON.parse(result);
    } catch (error) {
      console.error(`Failed to read key "${key}" from localStorage:`, error);
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        void e;
      }
      return false;
    }
  },
  remove: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove key "${key}" from localStorage:`, error);
    }
  },
  getAll: () => {
    try {
      return window.localStorage;
    } catch (error) {
      return {};
    }
  },
  clear: () => {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },
};

export default storePersist;
