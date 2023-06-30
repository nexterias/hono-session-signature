export const HASH_NAME = 'HMAC'
export const HASH_ALGORITHM = 'SHA-256'

/**
 * Imports a key from a buffer source.
 *
 * @param key The buffer source containing the key data.
 * @returns A promise that resolves with the imported key.
 *
 * @example
 * ```ts
 * import { importKey } from '@nexterias/hono-cookie-signature'
 *
 * const secret = await importKey(new TextEncoder().encode('THIS_IS_ULTRA_HYPER_SECRET_KEY'))
 *
 * console.log(secret)
 * ```
 */
export const importKey = (key: BufferSource) => {
  return crypto.subtle.importKey(
    'raw',
    key,
    { name: HASH_NAME, hash: HASH_ALGORITHM },
    false,
    ['sign', 'verify']
  )
}

/**
 * Signs the given data with the provided key.
 *
 * @param data The data to sign.
 * @param key The key to use for signing.
 * @returns A promise that resolves with the signature as a Uint8Array.
 */
export const sign = async (data: BufferSource, key: CryptoKey) => {
  const buf = await crypto.subtle.sign(
    { name: HASH_NAME, hash: HASH_ALGORITHM },
    key,
    data
  )

  return new Uint8Array(buf) // ArrayBuffer to Uint8Array
}

/**
 * Verifies the given signature for the provided data and key.
 *
 * @param key The key to use for verification.
 * @param signature The signature to verify.
 * @param data The source data to verify.
 * @returns A promise that resolves with a boolean indicating whether the signature is valid.
 */
export const verify = (
  key: CryptoKey,
  signature: BufferSource,
  data: BufferSource
) =>
  crypto.subtle.verify(
    { name: HASH_NAME, hash: HASH_ALGORITHM },
    key,
    signature,
    data
  )
