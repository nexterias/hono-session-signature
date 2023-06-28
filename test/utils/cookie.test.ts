import { expect, test } from 'vitest'
import { concatCookieValue, splitCookieValue } from '../../src/utils/cookie'

test('concatCookieValue', () => {
  expect(concatCookieValue('foo', 'bar')).toBe('foo.bar')
  expect(concatCookieValue('foo', '')).toBe('foo.')
  expect(concatCookieValue('', 'bar')).toBe('.bar')
  expect(concatCookieValue('', '')).toBe('.')
})

test('splitCookieValue', () => {
  expect(splitCookieValue('foo.bar')).toStrictEqual({
    value: 'foo',
    signature: 'bar',
  })
  expect(splitCookieValue('foo')).toStrictEqual({
    value: 'foo',
    signature: undefined,
  })
  expect(splitCookieValue('.bar')).toStrictEqual({
    value: undefined,
    signature: 'bar',
  })
  expect(splitCookieValue('')).toStrictEqual({
    value: undefined,
    signature: undefined,
  })
})
