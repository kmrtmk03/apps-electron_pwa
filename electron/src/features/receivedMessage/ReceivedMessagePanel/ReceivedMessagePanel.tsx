/** ReceivedMessagePanel の Props。 */
interface IReceivedMessagePanelProps {
  /** 表示する受信メッセージ（新しい順）。 */
  receivedMessages: IReceivedMessage[]
}

/** PWA から受信したメッセージを新しい順に一覧表示するパネル。 */
export const ReceivedMessagePanel = ({ receivedMessages }: IReceivedMessagePanelProps) => {
  if (receivedMessages.length === 0) {
    return <p className="message-empty">PWA からのメッセージを待っています。</p>
  }

  return (
    <ul className="message-list">
      {receivedMessages.map((received) => (
        <li key={received.receivedAt} className="message-item">
          <time className="message-time" dateTime={received.receivedAt}>
            {new Date(received.receivedAt).toLocaleTimeString()}
          </time>
          <p className="message-body">{received.message}</p>
        </li>
      ))}
    </ul>
  )
}
