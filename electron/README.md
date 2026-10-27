# electron

React + Vite のレンダラーと Electron 本体からなるデスクトップアプリ。
PWA を HTTPS で配信するサーバーと、PWA から呼ばれる API を内蔵し、受信したメッセージを画面に表示する。

セットアップ・起動手順・コマンド一覧は、リポジトリ直下の [README.md](../README.md) を参照。

## ディレクトリ構成

```text
electron/
├── electron/                 Electron 本体（メインプロセス・preload）
│   ├── main.ts               ウィンドウ生成、受信メッセージのレンダラーへの通知
│   ├── preload.ts            レンダラーへ公開する API（window.electronAPI）
│   ├── messageApi/           POST /api/message のルーターと、メッセージ通知用の型・IPC チャンネル定数
│   └── pwaServer/            PWA を HTTPS で配信するサーバー（ポート 5180）
├── src/                      レンダラー（React）
│   └── features/receivedMessage/   受信メッセージの一覧表示
├── scripts/generate-pwa-certs.js   mkcert による HTTPS 証明書の発行
├── certs/                    発行した証明書（git 管理外）
└── pwa-dist/                 配信する PWA のビルド成果物（git 管理外）
```

## API

| メソッド・パス | リクエストボディ | レスポンス |
|---|---|---|
| `POST /api/message` | `{ "message": string }` | 成功: `204`（画面に表示）／ 不正: `400` + `{ "error": string }` |
