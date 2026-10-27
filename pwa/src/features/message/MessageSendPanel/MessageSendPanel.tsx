import { useMessageSend } from './hooks/useMessageSend'
import './MessageSendPanel.css'

/** Electronアプリへ送るメッセージを入力し、APIを叩いて送信するパネル */
export const MessageSendPanel = () => {
  const { message, setMessage, isSending, status, errorMessage, send } = useMessageSend()

  return (
    <div className="message-send-panel">
      <h1>メッセージ送信</h1>
      <form
        className="message-send-form"
        onSubmit={(event) => {
          event.preventDefault()
          void send()
        }}
      >
        <input
          type="text"
          value={message}
          placeholder="Electronアプリに表示するメッセージ"
          onChange={(event) => setMessage(event.target.value)}
        />
        <button type="submit" disabled={isSending || message.length === 0}>
          {isSending ? '送信中' : '送信'}
        </button>
      </form>
      {status === 'success' && <p className="message-send-result">送信しました</p>}
      {errorMessage !== null && <p className="message-send-error">{errorMessage}</p>}
    </div>
  )
}
