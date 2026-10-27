import { contextBridge, ipcRenderer } from "electron"

import type { IReceivedMessage } from "./messageApi/messageApi.type"
import { MESSAGE_RECEIVED_CHANNEL } from "./messageApi/messageIpcChannels.constants"

/**
 * レンダラープロセスへ公開する最小限の API。
 * Node.js の機能を直接公開せず、必要な機能だけをここへ追加する。
 */
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  /**
   * PWA から API 経由でメッセージを受信したときに呼ばれるコールバックを登録する。
   * 戻り値の関数を呼ぶと登録を解除できる（コンポーネントのアンマウント時に必ず呼ぶこと）。
   */
  onMessageReceived: (callback: (received: IReceivedMessage) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, received: IReceivedMessage) => callback(received)
    ipcRenderer.on(MESSAGE_RECEIVED_CHANNEL, listener)
    return () => {
      ipcRenderer.removeListener(MESSAGE_RECEIVED_CHANNEL, listener)
    }
  },
})
