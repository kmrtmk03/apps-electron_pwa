# panasonic-electron-app

React と Electron を使用したデスクトップアプリケーションのテンプレート。
PWA から API を叩くと、受信したメッセージをアプリ画面に表示する。

このアプリは、別プロジェクトでビルドされたPWA（Progressive Web App）を、LAN内のスマートフォン等から
HTTPSでアクセスできるように配信する機能も内蔵している（`electron/pwaServer`）。

## セットアップ

前提: Node.js / pnpm がインストール済みであること。

```bash
git clone <このリポジトリのURL>
cd panasonic-2026-office
pnpm install
```

## 開発起動

```bash
pnpm dev
```

Vite開発サーバー・Electronの型チェック(watch)・Electron本体が同時に起動する。

## ビルド・パッケージング

```bash
pnpm build          # レンダラー(Vite) + Electron本体をビルド
pnpm package:mac    # macOS向けにパッケージング（dmg / zip）
pnpm package:win    # Windows向けにパッケージング（nsis）
```

## PWAをiPhoneからHTTPSで確認する手順

このアプリはElectronの起動時に、`pwa-dist/` ディレクトリの中身をHTTPSサーバーとして
LAN内に配信する（ポート `5180`）。スマートフォン側でPWAの「ホーム画面に追加」やService Workerを
正しく動作させるにはHTTPS（安全なコンテキスト）が必須のため、[mkcert](https://github.com/FiloSottile/mkcert)
で発行した自己署名証明書を使ってHTTPS化している。

### 1. mkcertをインストールする

```bash
# macOS
brew install mkcert nss

# Windows
choco install mkcert
# または
scoop install mkcert
```

### 2. PWAのビルド成果物を配置する

別プロジェクトでビルドしたPWAの成果物（`index.html` や `manifest.json`、`sw.js` を含むディレクトリの中身）を、
このリポジトリ直下の `pwa-dist/` にそのままコピーする。

```
panasonic-2026-office/
└── pwa-dist/
    ├── index.html
    ├── manifest.json
    ├── sw.js
    └── ...
```

`pwa-dist/` は `.gitignore` 対象であり、git管理はされない。

### 3. HTTPS証明書を発行する

PCがアクセス対象のWi-Fi/LANに接続された状態で、以下を実行する。

```bash
pnpm pwa:cert
```

内部で以下が行われる。

1. このPCのLAN内IPv4アドレスとホスト名を自動検出する
2. `mkcert -install` により、mkcertのローカルCAをこのPCの信頼済みストアに登録する
   （初回のみ実際に変更される。OSによってはパスワード入力や確認ダイアログが出る）
3. 検出したIPアドレス・ホスト名・`localhost` 宛の証明書を `certs/cert.pem` / `certs/key.pem` として発行する

`certs/` も `.gitignore` 対象のため、クローン直後は必ずこのコマンドを実行する必要がある。

> LANのIPアドレスが変わった場合（Wi-Fiの再接続、別ネットワークへの移動等）は、
> `pnpm pwa:cert` を再実行して証明書を発行し直すこと。

### 4. Electronアプリを起動する

```bash
pnpm dev
```

ログに以下が表示されれば、PWA配信サーバーがHTTPSで起動している。

```
[pwaServer] PWAの配信を開始しました: https://0.0.0.0:5180
```

（`pwa-dist/` または `certs/` が無い場合は、警告ログを出して配信をスキップするだけでアプリ本体は起動する）

### 5. iPhoneにmkcertのルートCA証明書をインストールする

mkcertの証明書はこのPC専用の自己署名CAで署名されているため、iPhone側にもそのCAを
信頼させる必要がある。

1. MacでルートCA証明書の場所を確認する

   ```bash
   open "$(mkcert -CAROOT)"
   ```

   （Windowsの場合は `mkcert -CAROOT` で表示されたフォルダをエクスプローラーで開く）

2. 表示された `rootCA.pem` を、AirDropなどでiPhoneに転送する
3. iPhoneで **設定 > 一般 > VPNとデバイス管理** を開き、受信したプロファイルをインストールする
4. **設定 > 一般 > 情報 > 証明書信頼設定** を開き、インストールしたmkcertのCAのスイッチをONにする
   （この手順を忘れると、プロファイルを入れても「安全でない接続」のままになる）

### 6. iPhoneからHTTPSでアクセスする

iPhoneを、PCと同じWi-Fi/LANに接続した状態で、Safariで以下にアクセスする。

```
https://<PCのLAN内IPアドレス>:5180/
```

PCのLAN内IPアドレスは、`pnpm pwa:cert` 実行時のログ（`IP=...` の部分）や、
macOSなら `ipconfig getifaddr en0`、Windowsなら `ipconfig` で確認できる。

鍵マークが付いて警告なく表示されれば成功。Safari下部の共有ボタンから
「ホーム画面に追加」を行うことで、PWAとしてインストールできる。

### うまくいかないとき

- `EADDRINUSE: address already in use 0.0.0.0:5180` というエラーが出る場合、
  ポート5180を既に使っている古い `pnpm dev` プロセスが残っている可能性がある。
  `lsof -nP -iTCP:5180 -sTCP:LISTEN`（Windowsは `netstat -ano | findstr 5180`）で
  プロセスを特定し、終了してから再度 `pnpm dev` を実行する
- iPhoneで警告が消えない場合、証明書信頼設定（手順5-4）のスイッチがONになっているか確認する
- PC・iPhoneが同じWi-Fi/LANに接続されているか確認する

## メッセージ受信API（PWA向け）

PWA配信サーバー（`electron/pwaServer`）にHTTP APIを内蔵している（`electron/messageApi/messageApiRouter.ts`）。
PWA自体もこのサーバーから配信されているため、同一オリジンの相対パスでfetchすればCORS設定は不要。

```
https://<PCのLAN内IPアドレス>:5180/api/message
```

### メッセージを送る

```
POST /api/message
```

**リクエストボディ**（必須、`Content-Type: application/json`）
```json
{ "message": "こんにちは" }
```
- `message`（string, 必須）: 画面に表示するメッセージ。空文字・string以外は `400`

**レスポンス**
- 成功: `204 No Content`（Electronアプリの画面に受信時刻つきで表示される）
- 失敗: `400` + `{ "error": string }`

```js
await fetch("/api/message", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "こんにちは" }),
})
```

### 新しいAPIを追加するには

1. `electron/messageApi/` を参考にルーターを追加し、`electron/pwaServer/pwaServer.ts` にマウントする
2. メインプロセス → 画面への通知が必要なら、IPCチャンネル定数を追加し `electron/preload.ts` で公開、`src/vite-env.d.ts` に型を追記する
