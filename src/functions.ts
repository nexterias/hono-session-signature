import { Context as HonoContext } from 'hono'
import { setCookie, getCookie as _getCookie } from 'hono/cookie'
import type { CookieOptions } from 'hono/utils/cookie'
import { sign, verify } from './signature'
import { decodeBase64Url, encodeBase64Url } from './utils/base64url'
import { getContextKey } from './utils/context'
import { concatCookieValue, splitCookieValue } from './utils/cookie'

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
   * @param name key
   * @param value value
   * @param options
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
 * Retrieves a verified cookie value from the Hono context.
 *
 * @param context - The Hono context object.
 * @param name - The name of the cookie to retrieve.
 * @returns The verified cookie value, or undefined if the cookie is not found or is invalid.
 *
 * **WARN: Use this function only when using the `cookieSignature` middleware.**
 */
export const getVerifiedCookie = (context: HonoContext, name: string) => {
  const value = context.get(getContextKey(name))

  if (typeof value !== 'string') return
  else return value
}

/**
 * Retrieves and verifies a cookie value
 *
 * @param context - The Hono context object.
 * @param key - The key used for signing the cookie.
 * @param name - The name of the cookie to retrieve.
 * @returns The verified cookie value, or undefined if the cookie is not found or is invalid.
 *
 * **If you are using the `cookieSignature` middleware, it is recommended to use `getVerifiedCookie`.**
 */
export const getCookie = async (
  context: HonoContext,
  key: CryptoKey,
  name: string
) => {
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
