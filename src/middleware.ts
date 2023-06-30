import type { Context as HonoContext, MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import { decodeBase64Url } from './utils/base64url'
import { verify } from './signature'
import { getContextKey } from './utils/context'
import { splitCookieValue } from './utils/cookie'

export const USE_MIDDLEWARE = Symbol('use-cookie-signature-middleware')

/**
 * Returns a boolean indicating whether the cookie signature middleware was used in the given context.
 *
 * @param context The Hono context object.
 * @returns A boolean indicating whether the cookie signature middleware was used.
 */
export const useCookieSignatureMiddleware = (context: HonoContext): boolean =>
  context.get(USE_MIDDLEWARE) ?? false

/**
 * Options for cookie signature middleware.
 */
export interface CookieSignatureMiddlewareOptions {
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
 * Middleware that supports pre-validation of specified cookie values.
 *
 * @param options The options for cookie signature middleware.
 * @example
 * ```ts
 * import { cookieSignature, importKey, getVerifiedCookie } from '@nexterias/hono-cookie-signature'
 * import { Hono } from 'hono'
 *
 * const app = new Hono()
 * const secret = await importKey(new TextEncoder().encode('THIS_IS_ULTRA_HYPER_SECRET_KEY'))
 *
 * app
 *  .use('/guard', cookieSignature({ secret, cookies: ['session_id'] }))
 *  .get('/guard', async (context) => {
 *    const sessionId = getVerifiedCookie(context, 'session_id')
 *
 *    console.log(sessionId)
 *
 *    return context.json({ message: 'ok' })
 *  })
 *
 * export default app
 * ```
 */
export const cookieSignature = (
  options: Readonly<CookieSignatureMiddlewareOptions>
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

    context.set(USE_MIDDLEWARE, true)

    return next()
  }
}
