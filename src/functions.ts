import { Context as HonoContext } from 'hono'
import { setCookie, getCookie as _getCookie } from 'hono/cookie'
import type { CookieOptions } from 'hono/utils/cookie'
import { sign, verify } from './signature'
import { decodeBase64Url, encodeBase64Url } from './utils/base64url'
import { getContextKey } from './utils/context'
import { concatCookieValue, splitCookieValue } from './utils/cookie'
import { useCookieSignatureMiddleware } from './middleware'

/**
 * Function to set a signed cookie in the Set-Cookie header
 *
 * @param key Key to use for signing
 * @returns setCookie wrapper
 */
export const setCookieWithSignature =
  (key: CryptoKey) =>
  /**
   * setCookie function
   * @param context Hono context object
   * @param name Cookie name
   * @param value Cookie value
   * @param options Cookie options
   * @returns Returns the value signature as a Uint8Array.
   */
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

/**
 * Retrieves a verified cookie value from the Hono context object.
 *
 * @param context The Hono context object.
 * @param name The name of the cookie to retrieve.
 * @returns The verified cookie value, or undefined if the cookie is not found or is invalid.
 * @throws An error if the cookie signature middleware is not used.
 */
export const getVerifiedCookie = (
  context: HonoContext,
  name: string
): string | undefined => {
  const value = context.get(getContextKey(name))

  if (typeof value === 'string') return value
  if (!useCookieSignatureMiddleware(context))
    throw Error('Cookie signature middleware is not used')
}

/**
 * Retrieves a cookie value from the Hono context object and verifies its signature.
 *
 * @param context The Hono context object.
 * @param key The key used for signing the cookie.
 * @param name The name of the cookie to retrieve.
 * @param ignoreMiddleware Whether to ignore the cookie signature middleware.
 * @returns The verified cookie value, or undefined if the cookie is not found or is invalid.
 * @throws An error if the cookie signature middleware is used and the cookie is already verified. (If not desired, set "ignoreMiddleware" to true)
 */
export const getCookie = async (
  context: HonoContext,
  key: CryptoKey,
  name: string,
  ignoreMiddleware: boolean = false
) => {
  if (!ignoreMiddleware && useCookieSignatureMiddleware(context)) {
    const hasVerifiedCookie =
      typeof context.get(getContextKey(name)) === 'string'

    if (hasVerifiedCookie)
      throw new Error(
        `Cookie("${name}") is already verified. Use "getVerifiedCookie" instead.`
      )
  }

  const rawCookieValue = _getCookie(context, name)
  if (!rawCookieValue) return

  const splittedCookieValue = splitCookieValue(rawCookieValue)
  if (!splittedCookieValue.signature || !splittedCookieValue.value) return

  const value = decodeBase64Url(splittedCookieValue.value)
  const signature = decodeBase64Url(splittedCookieValue.signature)

  const verified = await verify(key, signature, value)
  if (!verified) return

  return new TextDecoder().decode(value)
}
