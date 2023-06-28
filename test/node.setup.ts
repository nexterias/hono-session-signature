import { webcrypto } from 'node:crypto'

/**
 * Node.jsはv17.6.0, v16.15.0からWeb Crypto APIを実装しているが、Vitestの環境では持っていないため
 * 以下のコードで`node:crypto`のwebcryptoをグローバルに登録する。
 */
if (typeof global.crypto === 'undefined') {
  //@ts-expect-error
  global.crypto = webcrypto
}
