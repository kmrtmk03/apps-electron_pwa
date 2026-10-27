import { useEffect, useState } from "react"

/**
 * PWA から API 経由で受信したメッセージの一覧を管理するフック。
 * メインプロセスが window.electronAPI.onMessageReceived 経由で通知するたびに、新しい順で先頭へ追加する。
 *
 * MEMO: 受信履歴はメモリ上のみで保持し、アプリを再起動すると消える（テンプレートとしての最小実装）。
 */
export const useReceivedMessages = () => {
  const [receivedMessages, setReceivedMessages] = useState<IReceivedMessage[]>([])

  // 受信コールバックの登録と解除を同じ effect 内で完結させる（登録の戻り値が解除関数）
  useEffect(() => {
    return window.electronAPI.onMessageReceived((received) => {
      setReceivedMessages((prev) => [received, ...prev])
    })
  }, [])

  return {
    // 受信履歴（新しい順）
    receivedMessages,
  }
}
