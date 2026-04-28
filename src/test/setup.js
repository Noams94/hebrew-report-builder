import { beforeEach } from 'vitest'

if (typeof crypto.randomUUID !== 'function') {
  let counter = 0
  crypto.randomUUID = () => `test-uuid-${++counter}`
}

beforeEach(() => {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
})
