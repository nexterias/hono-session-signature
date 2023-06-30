import { test, expect, vi } from 'vitest'
import {
  getCookie,
  getVerifiedCookie,
  setCookieWithSignature,
} from '../src/functions'
import { Hono } from 'hono'
import { HONO_CONTEXT_COOKIE } from '../src/utils/context'
import { USE_MIDDLEWARE } from '../src/middleware'

const secret = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode('THIS_IS_SECRET_KEY'),
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign', 'verify']
)

test('setCookieWithSignature', async () => {
  const app = new Hono()
  const setCookie = setCookieWithSignature(secret)

  app.post('/set-cookie', async (context) => {
    const signature = await setCookie(context, 'foo', 'bar', { httpOnly: true })

    expect(signature).toBeInstanceOf(Uint8Array)

    return context.text('ok')
  })

  const response = await app.request('set-cookie', { method: 'POST' })
  const cookieHeader = response.headers.get('set-cookie')

  expect(cookieHeader).toBe(
    `foo=YmFy.WS-00fQOWmPL9s2SsjelfXb3OWTYOvD2h_rHbkN2ZQw; HttpOnly`
  )
})

test('getVerifiedCookie', async () => {
  const app = new Hono()

  app
    .get('/use-middleware', (context) => {
      // @ts-expect-error
      context.set(USE_MIDDLEWARE, true)
      // @ts-expect-error
      context.set(`${HONO_CONTEXT_COOKIE}:foo`, 'bar')

      expect(getVerifiedCookie(context, 'foo')).toBe('bar')
      expect(getVerifiedCookie(context, 'not-found')).toBeUndefined()

      return context.text('ok')
    })
    .get('/not-use-middleware', async (context) => {
      expect(() => getVerifiedCookie(context, 'foo')).toThrowError()
    })

  await app.request('/use-middleware')
  await app.request('/not-use-middleware')
})

test('getCookie', async () => {
  const app = new Hono()

  app
    .get('/not-use-middleware', async (context) => {
      expect(await getCookie(context, secret, 'correct')).toBe('Hello World!')
      expect(await getCookie(context, secret, 'invalid-format')).toBeUndefined()
      expect(
        await getCookie(context, secret, 'invalid-signature')
      ).toBeUndefined()
      expect(await getCookie(context, secret, 'not-found')).toBeUndefined()
    })
    .get('/use-middleware', async (context) => {
      // @ts-expect-error
      context.set(USE_MIDDLEWARE, true)
      // @ts-expect-error
      context.set(`${HONO_CONTEXT_COOKIE}:correct`, 'Hello World!')

      await expect(() =>
        getCookie(context, secret, 'correct')
      ).rejects.toThrowError()
      await expect(getCookie(context, secret, 'correct', true)).resolves.toBe(
        'Hello World!'
      )
    })

  await app.request('/use-middleware', {
    headers: {
      cookie:
        'correct=SGVsbG8gV29ybGQh.73Zwsqah8EXA61C31ymNXMgmgENqKYGew_Dv70strgk;',
    },
  })
  await app.request('/not-use-middleware', {
    headers: {
      cookie: [
        'correct=SGVsbG8gV29ybGQh.73Zwsqah8EXA61C31ymNXMgmgENqKYGew_Dv70strgk',
        'invalid-format=QmFzc2ZyZXE:zrSxFiL_eKqF5LpRfczrpSamQolHg0T6zkvqsJCqDWM',
        'invalid-signature=QmFzc2ZyZXE.zrSxFiL_eKqF5LpRfczrpSamQolHg0T6zkvqsJCqDWW',
      ].join('; '),
    },
  })
})
