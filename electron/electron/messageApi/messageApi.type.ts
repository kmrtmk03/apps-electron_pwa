/** PWA から API 経由で受信したメッセージ 1 件分。メインプロセス → レンダラーへ IPC で渡す。 */
export interface IReceivedMessage {
  /** 受信したメッセージ本文。 */
  message: string
  /** メインプロセスが受信した日時（ISO 8601 形式）。 */
  receivedAt: string
}
