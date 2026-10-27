/// <reference types="vite/client" />

/** PWA から API 経由で受信したメッセージ 1 件分（electron/messageApi/messageApi.type.ts と同じ形）。 */
interface IReceivedMessage {
  /** 受信したメッセージ本文。 */
  message: string
  /** メインプロセスが受信した日時（ISO 8601 形式）。 */
  receivedAt: string
}

interface Window {
  electronAPI: {
    platform: NodeJS.Platform
    /**
     * PWA から API 経由でメッセージを受信したときに呼ばれるコールバックを登録する。
     * 戻り値の関数を呼ぶと登録を解除できる。
     */
    onMessageReceived: (callback: (received: IReceivedMessage) => void) => () => void
  }
}
