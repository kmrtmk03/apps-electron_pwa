import express, { type Router } from "express"

import type { IReceivedMessage } from "./messageApi.type"

/**
 * PWA から呼び出されるメッセージ受信 API のルーター。
 * 受信したメッセージは onMessageReceived へ渡すだけで、表示方法（ウィンドウへの通知など）は呼び出し側に任せる。
 *
 * pwaServer.ts から `/api/message` にマウントされる想定。
 * 新しい API を追加する場合は、このファイルを参考に別ルーターを作り pwaServer.ts へマウントする。
 */
export const createMessageApiRouter = (onMessageReceived: (received: IReceivedMessage) => void): Router => {
  const router = express.Router()
  router.use(express.json())

  // メッセージを受信する（例: POST /api/message  body: { "message": "こんにちは" }）
  router.post("/", (req, res) => {
    const message: unknown = req.body?.message

    if (typeof message !== "string" || message.length === 0) {
      res.status(400).json({ error: "message は空でない文字列で指定してください。" })
      return
    }

    onMessageReceived({ message, receivedAt: new Date().toISOString() })
    res.status(204).end()
  })

  return router
}
