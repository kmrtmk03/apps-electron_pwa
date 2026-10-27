import { app, BrowserWindow } from "electron"
import path from "node:path"

import type { IReceivedMessage } from "./messageApi/messageApi.type"
import { MESSAGE_RECEIVED_CHANNEL } from "./messageApi/messageIpcChannels.constants"
import { startPwaServer } from "./pwaServer/pwaServer"

const isDevelopment = Boolean(process.env.VITE_DEV_SERVER_URL)

/** アプリケーションのメインウィンドウを生成する。 */
const createMainWindow = (): BrowserWindow => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // サンドボックス化した preload は独自の簡易モジュールローダーしか持たず、
      // ./messageApi/messageIpcChannels.constants のような相対 import で分割したファイルを解決できない。
      // preload からの複数ファイル require を可能にするため、preload のみサンドボックスを無効化する。
      // （renderer 側の contextIsolation / nodeIntegration の設定は変えていない）
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  })

  if (isDevelopment) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL as string)
    mainWindow.webContents.openDevTools({ mode: "detach" })
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../dist/index.html"))
  }

  return mainWindow
}

/**
 * PWA から受信したメッセージを、開いているすべてのウィンドウのレンダラーへ通知する。
 * macOS の activate でウィンドウが再生成される場合があるため、都度 getAllWindows で宛先を取得する。
 */
const notifyMessageReceived = (received: IReceivedMessage): void => {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(MESSAGE_RECEIVED_CHANNEL, received)
  })
}

app.whenReady().then(() => {
  createMainWindow()
  startPwaServer(notifyMessageReceived)

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

// ウィンドウを閉じたときに、PWA配信サーバー（HTTPS/ポート5180）を含むアプリ本体を確実に終了させる。
// macOSのウィンドウ管理の慣習（ウィンドウを閉じてもDockにアプリを残す）に従うと、
// アプリがバックグラウンドに残り続けてポートを掴んだままになり、次回起動時に
// EADDRINUSE で衝突するため、プラットフォームによらず必ず終了させる。
app.on("window-all-closed", () => {
  app.quit()
})
