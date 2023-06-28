import { Context as HonoContext } from 'hono'
import { setCookie } from 'hono/cookie'
import type { CookieOptions } from 'hono/utils/cookie'
import { sign } from './signature'
import { encodeBase64Url } from './utils/base64url'
import { getContextKey } from './utils/context'
import { concatCookieValue } from './utils/cookie'

export const setCookieWithSignature =
  (key: CryptoKey) =>
  async (
    context: HonoContext,
    name: string,
    value: string,
    options?: CookieOptions
  ) => {
    const encoder = new TextEncoder()
    const valueBuf = encoder.encode(value)
    const signature = await sign(valueBuf, key)

    setCookie(
      context,
      name,
      concatCookieValue(encodeBase64Url(valueBuf), encodeBase64Url(signature)),
      options
    )

    return signature
  }

export const getVerifiedCookie = (context: HonoContext, name: string) => {
  const value = context.get(getContextKey(name))

  if (typeof value !== 'string') return
  else return value
}
