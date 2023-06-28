import { expect, test } from 'vitest'
import { getContextKey, HONO_CONTEXT_COOKIE } from '../../src/utils/context'

test('getContextKey', () => {
  expect(getContextKey('foo')).toBe(HONO_CONTEXT_COOKIE + ':foo')
})
