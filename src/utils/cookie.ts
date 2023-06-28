export const concatCookieValue = (value: string, signature: string) =>
  `${value}.${signature}`

export const splitCookieValue = (
  cookieValue: string
): Readonly<Record<'value' | 'signature', string | undefined>> => {
  const [value, signature] = cookieValue.split('.').map((it) => it || void 0)

  return { value, signature }
}
