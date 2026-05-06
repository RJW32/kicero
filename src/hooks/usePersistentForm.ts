import {useEffect, useMemo, useRef, useState} from 'react';

export function usePersistentForm<T>(storageKeyBase: string, seed: T) {
  const [value, setValue] = useState<T>(seed);
  const [restored, setRestored] = useState(false);
  const timer = useRef<number | null>(null);
  const storageKey = useMemo(() => storageKeyBase, [storageKeyBase]);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as T;
      setValue(parsed);
      setRestored(true);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (timer.current) {
      window.clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    }, 250);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [storageKey, value]);

  const clear = () => {
    window.localStorage.removeItem(storageKey);
    setValue(seed);
    setRestored(false);
  };

  return {value, setValue, restored, clear, setRestored};
}
