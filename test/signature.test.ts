import { test, expect } from 'vitest'
import {
  HASH_ALGORITHM,
  HASH_NAME,
  importKey,
  sign,
  verify,
} from '../src/signature'

const secret = new TextEncoder().encode('THIS_IS_SECRET_KEY')

test('importKey', async () => {
  const key = await importKey(secret)

  expect(key.algorithm.name).toBe(HASH_NAME)
  expect(
    (key.algorithm as { name: string; hash: { name: string } }).hash.name
  ).toBe(HASH_ALGORITHM)
  expect(key.type).toBe('secret')
  expect(key.extractable).toBeFalsy()
  expect(key.usages).toContain('sign')
  expect(key.usages).toContain('verify')
})

test('sign', async () => {
  const key = await importKey(secret)
  const message = new Uint8Array([86, 65, 76, 85, 69]) // "VALUE"
  const expected = new Uint8Array([
    10, 126, 162, 235, 167, 208, 214, 128, 156, 208, 168, 192, 98, 70, 153, 125,
    106, 240, 119, 236, 91, 34, 182, 210, 68, 45, 52, 33, 90, 175, 186, 48,
  ])
  const actual = await sign(message, key)

  expect(actual).toStrictEqual(expected)
})

test('Must return true for values signed with the correct key', async () => {
  const key = await importKey(secret)
  const message = new Uint8Array([86, 65, 76, 85, 69]) // "VALUE"
  const signature = new Uint8Array([
    10, 126, 162, 235, 167, 208, 214, 128, 156, 208, 168, 192, 98, 70, 153, 125,
    106, 240, 119, 236, 91, 34, 182, 210, 68, 45, 52, 33, 90, 175, 186, 48,
  ])
  const actual = await verify(key, signature, message)

  expect(actual).toBeTruthy()
})

test('Must return false for values signed with the incorrect key', async () => {
  const key = await importKey(secret)
  const message = new Uint8Array([86, 65, 76, 85, 69]) // "VALUE"
  const signature = new Uint8Array([
    10, 126, 162, 235, 167, 208, 214, 128, 156, 208, 168, 192, 98, 70, 153, 125,
    106, 240, 119, 236, 91, 34, 182, 210, 68, 45, 52, 33, 90, 175, 186, 49,
  ])
  const actual = await verify(key, signature, message)

  expect(actual).toBeFalsy()
})
