import { ReceivedMessagePanel, useReceivedMessages } from "./features"

/** Electron 上で動作する React アプリケーションの入口。PWA から API 経由で受信したメッセージを表示する。 */
export const App = () => {
  const { receivedMessages } = useReceivedMessages()

  return (
    <main className="app">
      <div className="control-panel">
        <header className="control-panel-header">
          <p className="brand">受信メッセージ</p>
        </header>
        <div className="control-panel-body">
          <ReceivedMessagePanel receivedMessages={receivedMessages} />
        </div>
      </div>
    </main>
  )
}
