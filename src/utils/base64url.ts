export const encodeBase64Url = (buf: Uint8Array): string => {
  const base64 = btoa(String.fromCharCode(...buf))

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const decodeBase64Url = (base64Url: string) => {
  if (!/^[A-Za-z0-9_-]*$/.test(base64Url)) {
    throw new TypeError('Invalid base64url format')
  }

  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')

  while (base64.length % 4) {
    base64 += '='
  }

  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes
}
