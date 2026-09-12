import { useEffect, useState } from 'react'

function readInitialValue(key, initialValue) {
  if (typeof window === 'undefined') return initialValue

  const raw = window.localStorage.getItem(key)
  if (!raw) return initialValue

  try {
    return JSON.parse(raw)
  } catch {
    return initialValue
  }
}

export function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => readInitialValue(key, initialValue))

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}
