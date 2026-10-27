import fs from "node:fs"
import https from "node:https"
import path from "node:path"

import express from "express"

import type { IReceivedMessage } from "../messageApi/messageApi.type"
import { createMessageApiRouter } from "../messageApi/messageApiRouter"
import { PWA_SERVER_PORT } from "./pwaServer.constants"

// 別プロジェクトでビルドされたPWAの成果物を配置する想定のディレクトリ（リポジトリ直下）
// dist-electron/pwaServer/pwaServer.js から見て2階層上がリポジトリ直下にあたる
const PWA_DIST_DIR = path.join(__dirname, "../../pwa-dist")

// mkcert で発行した自己署名証明書の配置先（"pnpm run pwa:cert" で生成される）
const PWA_CERT_DIR = path.join(__dirname, "../../certs")
const PWA_CERT_FILE = path.join(PWA_CERT_DIR, "cert.pem")
const PWA_KEY_FILE = path.join(PWA_CERT_DIR, "key.pem")

/**
 * 別プロジェクトでビルドされたPWAの静的ファイルを、LAN内の他デバイス（スマートフォン等）から
 * アクセスできるようHTTPSで配信するサーバーを起動する。
 * PWAのインストール・Service Worker登録はセキュアコンテキスト（HTTPS or localhost）でのみ
 * 動作するため、スマートフォンからのアクセスにはHTTPS化が必須となる。
 *
 * mkcert証明書が未配置の場合は、Electronアプリ本体の起動を妨げないようHTTPSサーバーの起動を
 * スキップし警告のみ出力する。pwa-dist が未配置の場合も API は起動し、PWA 開発サーバーから
 * Vite のプロキシ経由で利用できるようにする。
 *
 * @param onMessageReceived PWA から /api/message でメッセージを受信したときに呼ばれるコールバック
 */
export const startPwaServer = (onMessageReceived: (received: IReceivedMessage) => void): void => {
  if (!fs.existsSync(PWA_CERT_FILE) || !fs.existsSync(PWA_KEY_FILE)) {
    console.warn(
      `[pwaServer] mkcert証明書が見つからないため起動をスキップします。"pnpm run pwa:cert" を実行して証明書を生成してください: ${PWA_CERT_DIR}`,
    )
    return
  }

  const app = express()

  // PWA からメッセージを送るための API。静的ファイル配信より先にマウントし、
  // /api/message 配下のリクエストが SPA フォールバック（index.html 返却）に奪われないようにする
  app.use("/api/message", createMessageApiRouter(onMessageReceived))

  if (fs.existsSync(PWA_DIST_DIR)) {
    // Service Worker はブラウザにキャッシュされると更新が反映されなくなるため、都度最新を取得させる
    app.get("/sw.js", (_req, res, next) => {
      res.setHeader("Cache-Control", "no-cache")
      next()
    })

    app.use(express.static(PWA_DIST_DIR))

    // PWA（SPA）として動作させるため、静的ファイルに一致しないルートは index.html にフォールバックする
    // （express.static で該当ファイルが見つからなかったリクエストのみここに到達する）
    app.use((_req, res) => {
      res.sendFile(path.join(PWA_DIST_DIR, "index.html"))
    })
  } else {
    // PWA の開発中は静的配信を省略し、Vite 開発サーバーから /api/message をプロキシさせる
    console.warn(`[pwaServer] 配信対象ディレクトリが見つかりません。API のみ起動します: ${PWA_DIST_DIR}`)
  }

  const httpsOptions = {
    cert: fs.readFileSync(PWA_CERT_FILE),
    key: fs.readFileSync(PWA_KEY_FILE),
  }

  https
    .createServer(httpsOptions, app)
    .listen(PWA_SERVER_PORT, "0.0.0.0", () => {
      console.log(`[pwaServer] PWAの配信を開始しました: https://0.0.0.0:${PWA_SERVER_PORT}`)
    })
    .on("error", (error) => {
      console.error("[pwaServer] 起動に失敗しました", error)
    })
}
