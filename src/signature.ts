export const HASH_NAME = 'HMAC'
export const HASH_ALGORITHM = 'SHA-256'

export const importKey = (key: BufferSource) => {
  return crypto.subtle.importKey(
    'raw',
    key,
    { name: HASH_NAME, hash: HASH_ALGORITHM },
    false,
    ['sign', 'verify']
  )
}

export const sign = async (data: BufferSource, key: CryptoKey) => {
  const buf = await crypto.subtle.sign(
    { name: HASH_NAME, hash: HASH_ALGORITHM },
    key,
    data
  )

  return new Uint8Array(buf) // ArrayBuffer to Uint8Array
}

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
