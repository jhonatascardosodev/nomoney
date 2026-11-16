const memory = new Map<string, string>();

/** Small key-value storage on web; falls back to memory when there is no window (e.g. static rendering). */
export const kvStorage =
  typeof window !== 'undefined' && window.localStorage
    ? window.localStorage
    : {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => void memory.set(key, value),
        removeItem: (key: string) => void memory.delete(key),
      };
