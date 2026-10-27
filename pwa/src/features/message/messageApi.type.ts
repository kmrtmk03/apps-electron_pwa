/**
 * メッセージ送信API（Electron側が配信する /api/message エンドポイント）の型定義。
 * フィールド名はAPI仕様書のキャメルケース表記をそのまま踏襲する。
 */

/** メッセージ送信API（POST /api/message）のリクエストボディ */
export interface ISendMessageRequest {
  /** Electronアプリの画面に表示するメッセージ本文 */
  message: string
}

/** APIがエラー時（400）に返すレスポンスボディ */
export interface IMessageApiErrorResponse {
  error: string
}
