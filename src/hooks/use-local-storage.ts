"use client"

import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    // This prevents a hydration mismatch by ensuring the first render on the client
    // uses the same initialValue as the server.
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Use a functional update to get the latest state
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Set the state for the current component
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          const newValue = JSON.stringify(valueToStore);
          const oldValue = window.localStorage.getItem(key);
          window.localStorage.setItem(key, newValue);

          // Dispatch a storage event to notify other hooks on the same page and in other tabs
          window.dispatchEvent(new StorageEvent('storage', {
            key,
            oldValue,
            newValue,
            storageArea: window.localStorage,
          }));
        }
      } catch (error) {
        console.error(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue]
  );
  
  // This effect syncs state across tabs and with other hooks on the same page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing new value for “${key}”:`, error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
