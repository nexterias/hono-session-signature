# @nexterias/hono-cookie-signature

Middleware for signing and verifying cookies with HMAC-SHA256

## 使用例

```js
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  cookieSignature,
  importKey,
  getVerifiedCookie,
  setCookieWithSignature,
} from '@nexterias/hono-cookie-signature'

const app = new Hono()
const secret = await importKey(new TextEncoder().encode('THIS_IS_SECRET_KEY'))
const setCookie = setCookieWithSignature(secret)
const cookies = {
  firstName: 'first_name',
  lastName: 'last_name',
}

app.use('/verify', cookieSignature({ secret, cookies: Object.values(cookies) }))
app.get('/verify', (context) => {
  const firstName = getVerifiedCookie(cookies.firstName)
  const lastName = getVerifiedCookie(cookies.lastName)

  return context.json({ message: `Hi! ${firstName} ${lastName} :)` })
})

app.post(
  '/sign',
  zValidator(
    'form',
    z.object({
      firstName: z.string().min(1).max(30),
      lastName: z.string().min(1).max(30),
    })
  ),
  async (context) => {
    const { firstName, lastName } = context.req.valid('form')

    await setCookie(context, cookies.firstName, firstName, {
      path: '/',
      httpOnly: true,
    })
    await setCookie(context, cookies.lastName, lastName, {
      path: '/',
      httpOnly: true,
    })

    return context.redirect('/verify')
  }
)

export default app
```

## ドキュメント

### `cookieSignature(options): MiddlewareHandler`

実行することで、Hono 用のミドルウェアハンドラを返します。

`options`引数には以下のプロパティを持つオブジェクトを渡してください

| プロパティ名 | 型          | 説明                             |
| ------------ | ----------- | -------------------------------- |
| `secret`     | `CryptoKey` | 署名に使用するキー               |
| `cookies`    | `string[]`  | 署名の検証を行う Cookie のキー値 |

```js
import { cookieSignature, importKey } from '@nexterias/hono-cookie-signature'

const secret = importKey(new TextEncoder().encode('DJ Myosuke'))

app
  // CookieヘッダーにセットされているfirstNameとlastNameの値が署名されているか検証する
  .use(
    '/verify',
    cookieSignature({ secret, cookies: ['firstName', 'lastName'] })
  )
  .get('/verify', (context) => {
    /**
     * firstNameとlastNameの署名が正しければここの処理が実行される
     * そうでなければHTTP 400またはHTTP 401を返し、この処理は実行されません。
     */
  })

export default app
```

### `importKey(key): Promise<CryptoKey>`

- `cookieSignature`や`setCookieWithSignature`関数で使用するための鍵を生成するのに使用します

| 引数  | 型           | 説明             |
| ----- | ------------ | ---------------- |
| `key` | `Uint8Array` | 署名に使う鍵の値 |

> _warning_
> 署名に使う鍵は、本番環境の場合は必ず強固で推測されにくいものを設定してください
> また、鍵は安全な場所に保存して厳重に管理してください

```js
import { importKey } from '@nexterias/hono-cookie-signature'

const secret = await importKey(
  new TextEncoder().encode('BCM (Bassfreq, CaZ, Mah!ro)')
)
```

### `getVerifiedCookie(context: HonoContext, name: string): string | undefined`

`cookieSignature`ミドルウェアで検証された Cookie の値を取得するのに使用します。

| 引数      | 型            | 説明                            |
| --------- | ------------- | ------------------------------- |
| `context` | `HonoContext` | Hono のコンテキストオブジェクト |
| `name`    | `string`      | Cookie のキー                   |

`name`に渡された Cookie のキーが間違っている場合、`undefined`が返されます。

```js
import { Hono } from 'hono'
import {
  getVerifiedCookie,
  cookieSignature,
  importKey,
} from '@nexterias/hono-cookie-signature'

const secret = await importKey(new TextEncoder().encode('Massive New Krew'))
const app = new Hono()

const cookies = {
  firstName: 'first_name',
  lastName: 'last_name',
}

app
  .use('/me', cookieSignature({ secret, cookies: Object.values(cookies) }))
  .get('/me', (context) => {
    const firstName = getVerifiedCookie(context, cookies.firstName)
    const lastName = getVerifiedCookie(context, cookies.lastName)

    return context.json({ firstName, lastName })
  })

export default app
```

### `setCookieWithSignature(secret: CryptoKey) => (context: HonoContext, name: string, value: string, options?: CookieOptions): Promise<Uint8Array>`

`Set-Cookie`でレスポンスに Cookie をセットすると共に、Cookie の値を署名を付与します。

| 引数     | 型          | 説明               |
| -------- | ----------- | ------------------ |
| `secret` | `CryptoKey` | 署名に使用するキー |

`setCookieWithSignature`関数を実行すると、以下の引数を必要とする`hono/cookie`の`setCookie`関数のラッパー関数が返されます。

| 引数       | 型              | 説明                            |
| ---------- | --------------- | ------------------------------- |
| `context`  | `HonoContext`   | Hono のコンテキストオブジェクト |
| `name`     | `string`        | Cookie のキー                   |
| `value`    | `string`        | Cookie の値                     |
| `options?` | `CookieOptions` | Cookie のオプション             |

```js
import { Hono } from 'hono'
import {
  setCookieWithSignature,
  importKey,
} from '@nexterias/hono-cookie-signature'

const secret = await importKey(new TextEncoder().encode('USAO'))
const setCookie = setCookieWithSignature(secret)
const app = new Hono()

const cookies = {
  firstName: 'first_name',
  lastName: 'last_name',
}

app.post('/about', async (context) => {
  const { firstName, lastName } = context.req.query()

  await setCookie(context, cookies.firstName, firstName)
  await setCookie(context, cookies.lastName, lastName, {
    path: '/',
    httpOnly: true,
    secure: true,
  })

  return context.json({ message: 'ok' })
})

export default app
```
