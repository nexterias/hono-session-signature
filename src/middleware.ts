import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { decodeBase64Url } from './utils/base64url'
import { verify } from './signature'
import { getContextKey } from './utils/context'
import { splitCookieValue } from './utils/cookie'

export interface CookieSignatureOptions {
  secret: CryptoKey
  cookies: string[]
}

export const cookieSignature = (
  options: Readonly<CookieSignatureOptions>
): MiddlewareHandler => {
  return async (context, next) => {
    for (const cookieKey of options.cookies) {
      const rawCookieValue = getCookie(context, cookieKey)
      if (!rawCookieValue) throw new HTTPException(400)

      const splittedCookieValue = splitCookieValue(rawCookieValue)
      if (!splittedCookieValue.value || !splittedCookieValue.signature)
        throw new HTTPException(400)

      const signature = decodeBase64Url(splittedCookieValue.signature)
      const cookieValue = decodeBase64Url(splittedCookieValue.value)

      const verified = await verify(options.secret, signature, cookieValue)
      if (!verified) throw new HTTPException(401)

      const decoder = new TextDecoder()
      context.set(getContextKey(cookieKey), decoder.decode(cookieValue))
    }

    return next()
  }
}
