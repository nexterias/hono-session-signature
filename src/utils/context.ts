export const HONO_CONTEXT_COOKIE = '@nexterias/hono-cookie-signature'

export const getContextKey = (name: string) => `${HONO_CONTEXT_COOKIE}:${name}`
