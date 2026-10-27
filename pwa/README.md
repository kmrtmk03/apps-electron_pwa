# pwa

React + TypeScript + Vite（vite-plugin-pwa）で作った PWA。
入力したメッセージを Electron アプリの API（`POST /api/message`）へ送信する。

セットアップ・起動手順・コマンド一覧は、リポジトリ直下の [README.md](../README.md) を参照。

## ディレクトリ構成

```text
pwa/
├── src/
│   ├── App.tsx
│   └── features/message/           メッセージ送信機能
│       ├── MessageSendPanel/       入力欄・送信ボタンの UI と、送信状態を扱うフック
│       ├── messageApi.utils.ts     /api/message を呼び出す処理
│       └── messageApi.type.ts      API のリクエスト・エラー応答の型
├── public/                         PWA アイコン
└── vite.config.ts                  PWA 設定と、開発時に /api/message を Electron へ転送するプロキシ
```

## 補足

- API は同一オリジンの相対パス（`/api/message`）で呼ぶ。本番は Electron が PWA を配信するため、開発時は Vite のプロキシ経由で Electron（`https://localhost:5180`）へ転送される
- Lint は oxlint（設定: `.oxlintrc.json`）
