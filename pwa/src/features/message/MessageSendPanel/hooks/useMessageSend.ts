import { useCallback, useState } from 'react'

import { sendMessage } from '../../messageApi.utils'

/** 送信結果の表示状態。idle は未送信、success / error は直近の送信結果を表す */
type TSendStatus = 'idle' | 'success' | 'error'

/** メッセージの入力状態と、Electronアプリへの送信操作を提供するフック */
export const useMessageSend = () => {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [status, setStatus] = useState<TSendStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSend = useCallback(async () => {
    // 空入力はサーバー側でも400になるため、送信せずに見送る
    if (message.length === 0) return

    setIsSending(true)
    setErrorMessage(null)
    try {
      await sendMessage(message)
      setStatus('success')
      setMessage('')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'メッセージの送信に失敗しました')
    } finally {
      setIsSending(false)
    }
  }, [message])

  return {
    // 入力状態
    message,
    setMessage,
    // 送信状態
    isSending,
    status,
    errorMessage,
    // 操作
    send: handleSend,
  }
}
