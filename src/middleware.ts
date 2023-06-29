import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import { decodeBase64Url } from './utils/base64url'
import { verify } from './signature'
import { getContextKey } from './utils/context'
import { splitCookieValue } from './utils/cookie'

/**
 * Options for cookie signature middleware.
 */
export interface CookieSignatureOptions {
  /**
   * The secret key used to sign the cookie.
   */
  secret: CryptoKey

  /**
   * An array of cookie keys to verify the signature for.
   */
  cookies: string[]
}

/**
 * @param options The options for cookie signature middleware.
 * @returns Middleware handler.
 */
export const cookieSignature = (
  options: Readonly<CookieSignatureOptions>
): MiddlewareHandler => {
  return async (context, next) => {
    for (const cookieKey of options.cookies) {
      const rawCookieValue = getCookie(context, cookieKey)
      if (!rawCookieValue)
        return context.json(
          { message: `Cookie(${cookieKey}) is required.` },
          400
        )

      const splittedCookieValue = splitCookieValue(rawCookieValue)
      if (!splittedCookieValue.value || !splittedCookieValue.signature)
        return context.json({ message: 'Invalid cookie value' }, 400)

      const signature = decodeBase64Url(splittedCookieValue.signature)
      const cookieValue = decodeBase64Url(splittedCookieValue.value)

      const verified = await verify(options.secret, signature, cookieValue)
      if (!verified) return context.json({ message: 'Invalid signature' }, 400)

      const decoder = new TextDecoder()
      context.set(getContextKey(cookieKey), decoder.decode(cookieValue))
    }

    return next()
  }
}
