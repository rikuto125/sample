/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GoatCounter サイトコード（公開値）。未設定なら計測 sink は登録されない（no-op）。 */
  readonly VITE_GOATCOUNTER_CODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
