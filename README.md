# @nexterias/hono-cookie-signature

Middleware for signing and verifying cookies with HMAC-SHA256

[![Documentation](https://github.com/nexterias/hono-session-signature/actions/workflows/docs.yml/badge.svg)](https://github.com/nexterias/hono-session-signature/actions/workflows/docs.yml)
[![Testing](https://github.com/nexterias/hono-session-signature/actions/workflows/tests.yml/badge.svg)](https://github.com/nexterias/hono-session-signature/actions/workflows/tests.yml)

## Usage

```js
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  cookieSignature,
  importKey,
  getVerifiedCookie,
  setCookieWithSignature,
} from '@nexterias/hono-cookie-signature'

const app = new Hono()
const secret = await importKey(new TextEncoder().encode('THIS_IS_SECRET_KEY'))
const setCookie = setCookieWithSignature(secret)
const cookies = {
  firstName: 'first_name',
  lastName: 'last_name',
}

app.use('/verify', cookieSignature({ secret, cookies: Object.values(cookies) }))
app.get('/verify', (context) => {
  const firstName = getVerifiedCookie(cookies.firstName)
  const lastName = getVerifiedCookie(cookies.lastName)

  return context.json({ message: `Hi! ${firstName} ${lastName} :)` })
})

app.post(
  '/sign',
  zValidator(
    'form',
    z.object({
      firstName: z.string().min(1).max(30),
      lastName: z.string().min(1).max(30),
    })
  ),
  async (context) => {
    const { firstName, lastName } = context.req.valid('form')

    await setCookie(context, cookies.firstName, firstName, {
      path: '/',
      httpOnly: true,
    })
    await setCookie(context, cookies.lastName, lastName, {
      path: '/',
      httpOnly: true,
    })

    return context.redirect('/verify')
  }
)

export default app
```
