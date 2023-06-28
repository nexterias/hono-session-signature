import { test, expect } from 'vitest'
import { getVerifiedCookie, setCookieWithSignature } from '../src/functions'
import { Hono } from 'hono'
import { HONO_CONTEXT_COOKIE } from '../src/utils/context'

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

  app.get('/get-cookie', (context) => {
    // @ts-expect-error
    context.set(`${HONO_CONTEXT_COOKIE}:foo`, 'bar')

    expect(getVerifiedCookie(context, 'foo')).toBe('bar')
    expect(getVerifiedCookie(context, 'not-found')).toBeUndefined()

    return context.text('ok')
  })

  const response = await app.request('get-cookie')

  expect(response.status).toBe(200)
})