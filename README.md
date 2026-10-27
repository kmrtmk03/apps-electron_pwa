# apps-electron_pwa

Electron アプリから PWA を HTTPS で配信し、その PWA から Electron 側の API を叩くサンプル（テンプレート）プロジェクト。

PWA の入力欄からメッセージを送信すると、`POST /api/message` 経由で Electron アプリの画面に受信メッセージが表示される。

## 構成

```text
apps-electron_pwa/
├── electron/   Electron アプリ本体（React + Vite）。PWA の配信サーバーと API を内蔵
└── pwa/        PWA（React + Vite + vite-plugin-pwa）。Electron の API を呼び出す
```

```text
[iPhone / ブラウザ]  PWA  ──POST /api/message──▶  [Electron] pwaServer (HTTPS :5180) ──IPC──▶ 画面に表示
```

- PWA は Electron の `pwaServer`（ポート `5180`）から配信されるため、API は同一オリジンの相対パス（`/api/message`）で呼べる
- 各ディレクトリの構成は [electron/README.md](electron/README.md)、[pwa/README.md](pwa/README.md) を参照。セットアップ・起動手順はこのファイルに集約している

## 前提

- Node.js（動作確認: v24）
- pnpm（動作確認: v11。`electron/package.json` の `packageManager` は `pnpm@10.28.0`）
- [mkcert](https://github.com/FiloSottile/mkcert)（スマートフォンから HTTPS で PWA を開く場合に必要）

```bash
# mkcert のインストール
brew install mkcert nss     # macOS
choco install mkcert        # Windows（scoop install mkcert でも可）
```

## クローン後の初期設定

`electron` と `pwa` はそれぞれ独立したパッケージなので、**両方で** `pnpm install` が必要。

```bash
git clone <このリポジトリの URL>
cd apps-electron_pwa

# 1. 依存パッケージのインストール
(cd electron && pnpm install)
(cd pwa && pnpm install)

# 2. HTTPS 証明書の発行（PC が対象の Wi-Fi / LAN に接続された状態で実行）
(cd electron && pnpm pwa:cert)
```

`certs/`（証明書・秘密鍵）と `pwa-dist/`（PWA のビルド成果物）は `.gitignore` 対象のため、クローン直後は存在しない。
証明書が無い場合、Electron は PWA 配信サーバー（API 含む）の起動をスキップして警告ログを出すだけで、アプリ本体は起動する。

> LAN の IP アドレスが変わった場合（Wi-Fi の再接続・別ネットワークへの移動など）は `pnpm pwa:cert` を再実行する。

## 起動手順

### A. PWA を Electron から配信して動かす（本番に近い構成）

```bash
# 1. PWA をビルドする
cd pwa
pnpm build

# 2. ビルド成果物を Electron の配信ディレクトリへコピーする（pwa/dist の中身 → electron/pwa-dist）
mkdir -p ../electron/pwa-dist
cp -R dist/. ../electron/pwa-dist/

# 3. Electron を起動する
cd ../electron
pnpm dev
```

起動ログに次の行が出れば配信できている。

```text
[pwaServer] PWAの配信を開始しました: https://0.0.0.0:5180
```

同じ Wi-Fi / LAN のスマートフォンやブラウザから `https://<PC の LAN 内 IP アドレス>:5180/` を開く。
スマートフォンで開く場合は mkcert のルート CA を端末に信頼させる必要がある（次節を参照）。

#### iPhone から HTTPS でアクセスする

PWA の「ホーム画面に追加」や Service Worker はセキュアコンテキスト（HTTPS）でのみ動作する。
証明書は mkcert のローカル CA で署名されているため、iPhone にもその CA を信頼させる。

1. Mac でルート CA 証明書の場所を開く

   ```bash
   open "$(mkcert -CAROOT)"
   ```

   （Windows は `mkcert -CAROOT` で表示されたフォルダをエクスプローラーで開く）
2. 表示された `rootCA.pem` を AirDrop などで iPhone に転送する
3. iPhone の **設定 > 一般 > VPNとデバイス管理** で、受信したプロファイルをインストールする
4. **設定 > 一般 > 情報 > 証明書信頼設定** で、インストールした mkcert の CA をオンにする（これを忘れると「安全でない接続」のままになる）
5. iPhone を PC と同じ Wi-Fi / LAN に接続し、Safari で `https://<PC の LAN 内 IP アドレス>:5180/` を開く
6. 警告なく表示されたら、共有ボタンの「ホーム画面に追加」で PWA としてインストールできる

LAN 内 IP アドレスは、`pnpm pwa:cert` 実行時のログ（`IP=...`）、macOS なら `ipconfig getifaddr en0`、Windows なら `ipconfig` で確認できる。

### B. PWA を開発サーバーで動かす（PWA の開発用）

Electron を先に起動した状態で、PWA の開発サーバーを立てる。

```bash
# ターミナル 1: Electron（API サーバーを含む）
cd electron
pnpm dev

# ターミナル 2: PWA の開発サーバー
cd pwa
pnpm dev
```

`http://127.0.0.1:5432/` を開く。`/api/message` は Vite のプロキシ（`pwa/vite.config.ts`）経由で `https://localhost:5180` の Electron へ転送される。
この構成でも Electron 側の証明書（`certs/`）は必要。

## 動作確認

1. Electron を起動し、画面に「PWA からのメッセージを待っています。」と表示されることを確認する
2. PWA を開き、入力欄にメッセージを入れて「送信」を押す
3. Electron の画面に受信時刻つきでメッセージが表示される

PWA を使わずに API だけ確認する場合は、次のように curl で叩ける。

```bash
curl -k -X POST https://localhost:5180/api/message \
  -H "Content-Type: application/json" \
  -d '{"message":"こんにちは"}'
```

成功すると `204 No Content` が返る。`message` が空文字・文字列以外の場合は `400` が返る。

## 主なコマンド

| 場所 | コマンド | 内容 |
|---|---|---|
| `electron/` | `pnpm dev` | Vite・Electron の型チェック(watch)・Electron 本体を同時起動 |
| `electron/` | `pnpm typecheck` | レンダラー・Electron 本体の型チェック |
| `electron/` | `pnpm build` | レンダラー(Vite) と Electron 本体をビルド |
| `electron/` | `pnpm pwa:cert` | HTTPS 証明書（mkcert）を発行 |
| `electron/` | `pnpm package:mac` / `package:win` | 配布用にパッケージング |
| `pwa/` | `pnpm dev` | PWA の開発サーバー（ポート 5432） |
| `pwa/` | `pnpm build` | 型チェック + PWA のビルド（`pwa/dist/`） |
| `pwa/` | `pnpm lint` | oxlint で静的解析 |

## うまくいかないとき

- `EADDRINUSE: address already in use 0.0.0.0:5180`: 古い Electron プロセスがポートを掴んでいる。`lsof -nP -iTCP:5180 -sTCP:LISTEN` で特定して終了する
- `[pwaServer] mkcert証明書が見つからないため...` の警告: `electron/` で `pnpm pwa:cert` を実行する
- PWA を開いても画面が出ない: `electron/pwa-dist/` に PWA のビルド成果物がコピーされているか確認する
- PWA の開発サーバーから送信が失敗する: Electron が起動していて `5180` で待ち受けているか確認する

## 新しい API を追加するには

1. `electron/electron/messageApi/` を参考にルーターを追加し、`electron/electron/pwaServer/pwaServer.ts` にマウントする
2. Electron の画面へ通知する場合は、IPC チャンネル定数を追加し `electron/electron/preload.ts` で公開、`electron/src/vite-env.d.ts` に型を追記する
3. PWA 側は `pwa/src/features/message/messageApi.utils.ts` を参考に呼び出し処理を追加する
4. 開発サーバー(B)で呼ぶ場合は `pwa/vite.config.ts` の `server.proxy` に新しいパスを追加する
