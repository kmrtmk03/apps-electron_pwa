import type { IMessageApiErrorResponse, ISendMessageRequest } from './messageApi.type'

/**
 * PWA自体もElectron側のサーバーから配信されているため、同一オリジンの相対パスで
 * fetchすればよい（CORS対応やLAN IPの決め打ちは不要）。
 */
const MESSAGE_API_PATH = '/api/message'

/**
 * レスポンスボディがメッセージAPIのエラー形式かどうかを検証する型ガード。
 * サーバー実装の変更でerrorフィールドが欠ける事故を防ぐため、直後に検証する。
 */
const isMessageApiErrorResponse = (value: unknown): value is IMessageApiErrorResponse => {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.error === 'string'
}

/**
 * Electronアプリへメッセージを送信する。
 * 成功時は204（ボディなし）が返る。失敗時はサーバーが返したメッセージで例外を投げる。
 */
export const sendMessage = async (message: string): Promise<void> => {
  const requestBody: ISendMessageRequest = { message }
  const res = await fetch(MESSAGE_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })
  if (res.ok) return

  const body: unknown = await res.json().catch(() => null)
  throw new Error(isMessageApiErrorResponse(body) ? body.error : 'メッセージの送信に失敗しました')
}
