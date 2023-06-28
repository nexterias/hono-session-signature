import { test, expect } from 'vitest'
import { encodeBase64Url, decodeBase64Url } from '../../src/utils/base64url'

const strings = [
  ['', ''],
  ['ß', 'w58'],
  ['f', 'Zg'],
  ['fo', 'Zm8'],
  ['foo', 'Zm9v'],
  ['foob', 'Zm9vYg'],
  ['fooba', 'Zm9vYmE'],
  ['foobar', 'Zm9vYmFy'],
  ['>?>d?ß', 'Pj8-ZD_Dnw'],
] as const

test('encodeBase64Url', () => {
  for (const [input, expected] of strings) {
    const buf = new TextEncoder().encode(input)

    expect(encodeBase64Url(buf)).toBe(expected)
  }
})

test('decodeBase64Url', () => {
  for (const [expected, input] of strings) {
    const buf = decodeBase64Url(input)

    expect(new TextDecoder().decode(buf)).toBe(expected)
  }
})

test('decodeBase64Url throws on invalid input', () => {
  const invalidStrings = [
    'Pj8/ZD+Dnw',
    'PDw/Pz8+Pg',
    'Pj8/ZD+Dnw==',
    'PDw/Pz8+Pg==',
  ] as const

  for (const input of invalidStrings) {
    expect(() => decodeBase64Url(input)).toThrow()
  }
})
