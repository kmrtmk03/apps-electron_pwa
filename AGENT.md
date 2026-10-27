# AGENT.md

このリポジトリで作業するエージェント（Claude Code など）向けの指示書。
グローバルの `~/.claude/CLAUDE.md` を元に、このプロジェクトの構成・規約に合わせて具体化している。
このファイルとグローバル設定が矛盾する場合は、**このファイルを優先**する。

## プロジェクト概要

Electron アプリから PWA を HTTPS で配信し、その PWA から Electron 側の API を叩くサンプル（テンプレート）。
PWA で入力したメッセージを `POST /api/message` で送ると、Electron の画面に表示される。

```text
apps-electron_pwa/
├── electron/   Electron アプリ本体（React + Vite）。PWA 配信サーバーと API を内蔵
└── pwa/        PWA（React + Vite + vite-plugin-pwa）。Electron の API を呼び出す
```

- `electron` と `pwa` は**独立したパッケージ**。依存追加・コマンド実行は対象ディレクトリで行う（パッケージマネージャーは pnpm）
- セットアップ・起動手順・コマンド一覧は [README.md](README.md) に集約している。手順を変えたら README も更新する
- テンプレートなので、**機能を増やすより「分かりやすい最小構成」を保つ**ことを優先する

## 最重要原則

1. **書く前に読む**: 変更対象と周辺コード（呼び出し元・型・定数・隣接ファイル）を理解してから実装する
2. **既存に合わせる**: 自分の好みより、既存コードのパターンを優先する
3. **スコープを守る**: 依頼されたことだけを行う。ついでのリファクタリングや無関係な整形を混ぜない
4. **終わる前に見直す**: 依頼文と自分の差分を照合してから完了を宣言する
5. **正直に報告する**: 検証結果・失敗・スキップした確認をそのまま伝える

## 言語

- 回答・コミットメッセージ・PR タイトルと説明欄・コード内コメントは**日本語**
- 英語で依頼された場合を除き、途中から英語に切り替えない

## 作業の進め方

1. **理解**: 変更対象に加え、呼び出し元・関連する型・定数・隣接ファイルを先に読む。推測で書き始めない
2. **方針**: 変更が波及する箇所を列挙する。複数案がある場合は「既存パターンとの整合」と「影響範囲の小ささ」で選び、判断が分かれた点は採用理由を回答に添える
3. **実装**: スコープを守る。`null` / `undefined` / 空配列 / 空文字 / 想定外の呼び出し順序を洗い出して防御する
4. **自己レビュー**: 依頼文と差分を照合する。デバッグコード・未使用 import・命名の揺れ・コメント不足がないか確認する
5. **検証**: 下記「検証コマンド」を実行して結果を報告する。実行しなかった検証は明記する

### 不確実なとき

- 仕様の解釈で成果物が大きく変わる → 実装前に質問する
- 解釈の揺れが小さい → 妥当なデフォルトで進め、採用した前提を回答の冒頭で明示する
- 調べれば分かること（コード内の事実、コマンドの有無、設定値）→ 聞かずに自分で調べる
- ライブラリや共有ユーティリティの API → 記憶に頼らず型定義・既存の使用例を確認してから使う
- コマンドが失敗したら、エラーから原因を特定してから対処する。原因不明のまま同じ操作を繰り返さない

## 検証コマンド

| 変更場所 | コマンド（対象ディレクトリで実行） | 内容 |
|---|---|---|
| `electron/` | `pnpm typecheck` | レンダラー・Electron 本体の型チェック |
| `electron/` | `pnpm build` | ビルド（ビルド設定・エントリー HTML・グローバル CSS を変えたとき） |
| `pwa/` | `pnpm lint` | oxlint による静的解析 |
| `pwa/` | `pnpm build` | 型チェック + ビルド |

- テストは未整備。自動検証できない部分（Electron の画面表示、PWA と Electron の疎通など）は、手動で確認すべき観点を報告に書く
- 疎通確認は README の「動作確認」（curl での `POST /api/message`）を使える

## ディレクトリ構成と配置の原則

### electron/

```text
electron/
├── electron/                    メインプロセス・preload（tsc でコンパイル → dist-electron/）
│   ├── main.ts                  ウィンドウ生成、受信メッセージのレンダラーへの通知
│   ├── preload.ts               レンダラーへ公開する API（window.electronAPI）
│   ├── messageApi/              POST /api/message のルーター、型、IPC チャンネル定数
│   └── pwaServer/               PWA 配信 HTTPS サーバー（ポート 5180）
├── src/                         レンダラー（React + Vite）
│   ├── features/<機能名>/       機能単位のディレクトリ（バレル export あり）
│   └── vite-env.d.ts            window.electronAPI など、レンダラーから見える型
└── scripts/generate-pwa-certs.js
```

### pwa/

```text
pwa/src/
├── App.tsx
└── features/<機能名>/           機能単位のディレクトリ
    ├── <Panel名>/               UI（<Panel名>.tsx）と、専用フック（hooks/）、専用 CSS
    ├── <機能>Api.utils.ts       API 呼び出し
    └── <機能>Api.type.ts        API のリクエスト・レスポンス型
```

### 原則

- 機能に固有の実装（UI・ロジック・定数・型）は、その機能のディレクトリ内で完結させる
- 共有ディレクトリ（`components` / `hooks` / `utils` / `types` など）へ移すのは、複数箇所で実際に再利用されてから。先回りした共通化・抽象化はしない
- 型は参照範囲が広がったときだけ段階的に昇格させる（実装ファイル内 → 機能単位の型ファイル → ページ共通 → プロジェクト共通）
- electron の `features/` は **バレル export（`index.ts`）を使っている**。新規ディレクトリも同じ構成にし、import はバレル経由にする
- git 管理外（`.gitignore`）: `node_modules` / `dist` / `dist-electron` / `dev-dist` / `pwa-dist` / `certs`。これらを編集・コミットしない

## このプロジェクト特有の注意点

### Electron ↔ レンダラー ↔ PWA の通り道

新しい API を追加するときは、次の順で既存の `messageApi` を参考に実装する（README の「新しい API を追加するには」と同じ）。

1. `electron/electron/<機能名>Api/` にルーター・型・IPC チャンネル定数を作り、`pwaServer.ts` で `app.use("/api/...", ...)` としてマウントする
2. 画面へ通知する場合は、メインプロセスから `webContents.send` し、`preload.ts` の `contextBridge` で**必要な関数だけ**公開する。`src/vite-env.d.ts` の `Window.electronAPI` に型を追記する
3. PWA 側は `pwa/src/features/<機能名>/` に API 呼び出しと UI を追加する。開発サーバー(`pnpm dev`)から呼ぶ場合は `pwa/vite.config.ts` の `server.proxy` にパスを追加する

### セキュリティ・設定

- `contextIsolation: true` / `nodeIntegration: false` を変えない。Node.js の機能を renderer へ直接公開しない
- `sandbox: false` は「preload が相対 import で分割したファイルを読むため」の例外的な設定。理由コメントを消さない。preload を分割しない構成に変える場合のみ見直す
- PWA の API は同一オリジンの相対パス（`/api/...`）で呼ぶ。LAN の IP アドレスや CORS 設定を決め打ちしない
- API の入力は信頼しない。`req.body` は `unknown` で受け、型を検証してから使う（`400` を返す）
- 証明書（`electron/certs/`）・秘密鍵をコミットしない・内容を出力しない
- PWA 配信サーバーは LAN に公開される。認証なしで操作系 API を増やす場合は、攻撃面が増える点を回答で明示する

## 命名規則

省略形や曖昧な名前を避け、命名だけで役割が分かるようにする。

| 対象 | 規則 | 例 |
|---|---|---|
| コンポーネント | `PascalCase`（ファイル名も同じ、1 ファイル 1 コンポーネント） | `MessageSendPanel.tsx` |
| カスタムフック | `useXxx`（ファイル名も同じ） | `useMessageSend.ts` |
| 定数 | `UPPER_SNAKE_CASE` | `MESSAGE_RECEIVED_CHANNEL` |
| イベントハンドラ | `handleXxx` | `handleSend` |
| boolean | `isXxx` | `isSending` |
| interface | `IXxx` | `IReceivedMessage` |
| type エイリアス・ジェネリック型パラメータ | `TXxx` | `TSendStatus` |
| 型ガード | `isXxx(value): value is T` | `isMessageApiErrorResponse` |

- ファイル接尾辞は責務ごとに揃える: `*.type.ts` / `*.constants.ts` / `*.utils.ts`
- 外部（API・IPC など）から受けたデータのフィールド名は、送信元の命名をそのまま維持する。アプリ側で新しく作る名前は camelCase
- IPC チャンネル名は `<機能>:<動作>` 形式（例: `message:received`）

## コーディング規約

### フォーマット（ディレクトリで異なる。周辺のファイルに合わせる）

| | electron/ | pwa/ |
|---|---|---|
| クォート | ダブルクォート `"` | シングルクォート `'` |
| セミコロン | なし | なし |
| 末尾カンマ | あり | あり |

Prettier 等の設定ファイルは無い。既存ファイルの書式を正とし、新しいスタイルを持ち込まない。

### 共通

- 可読性を最優先: 早期 return、浅いネスト、単一責任の関数
- マジックナンバー・文字列のハードコードは定数化する（例: API パス、ポート番号、IPC チャンネル名）
- エラーは握りつぶさない。`try/catch` は対処できる箇所に限定し、後続を必ず進める処理は `finally` で保証する
- JSON は手動で連結せず `JSON.stringify` / `JSON.parse` を使う

### TypeScript

- strict 前提。`any` を使わない。外部からの不定データは `unknown` で受けて型ガードで絞り込む
- 型アサーション（`as`）は最後の手段。`@ts-ignore` で型エラーを無視しない
- `enum` は使わず Union 型を使う
- 方向の異なる型（送信用・受信用）はファイルを分ける
- electron の main / preload / renderer で同じ形の型を持つ場合（例: `IReceivedMessage`）、片方を変えたらもう片方（`src/vite-env.d.ts` と `electron/messageApi/messageApi.type.ts`）も必ず揃える

### React

- Functional Component + Hooks。tsx は UI の記述に専念し、ロジックは Custom Hook へ切り出す
- フックは UI を返さず、状態と操作のみを返す。return オブジェクトは関連する値・操作ごとにグループ化してコメントを付ける
- フックが返す関数は `useCallback` で安定化する。`useMemo` は根拠がある場合のみ
- state は必要最小限にし、派生できる値は state にしない。更新は `setState((prev) => ...)` を優先する
- 不要な `useEffect` を作らない。登録と解除は同じ `useEffect` 内で完結させる（例: `onMessageReceived` の戻り値の解除関数を cleanup で返す）
- 特定コンポーネント専用のフックは、そのコンポーネント配下の `hooks/` に置く
- import 順: `react` → 外部ライブラリ → エイリアス → 相対
- スタイルは各コンポーネント専用の CSS ファイル、または electron の `styles.css` に置く。グローバル CSS にページ固有の調整を増やさない

### コメント

日本語で多めに書き、実装を追わなくても流れと注意点が分かるようにする。

- 関数・フック・型には JSDoc（`/** */`）で役割を書く
- 呼び出し契約・副作用・注意点（「戻り値の関数を必ず呼んで解除すること」など）は特に明記する
- 処理の言い換えではなく、意図や前提を書く
- データの流れ（main → preload → renderer、PWA → API）が分かるように書く
- 暫定対応・未実装・将来の変更予定は `TODO:` / `MEMO:` を付ける

## Git 運用

- ブランチ名: 英小文字・数字・`-`・`/` のみのケバブケース。prefix はコミットの prefix と揃える（例: `feat/message-history`）
- `develop` / `main` / `release` では直接コミットしない。コード変更に着手する前に現在のブランチを確認し、長期ブランチ上なら先に作業用ブランチを切る
- コミットは意味のある小さな単位に分割する。feat と refactor など性質が混ざる場合は分ける
- コミットメッセージ（日本語）: `<prefix>: <修正内容の要約>`。prefix は `feat` / `fix` / `docs` / `style` / `refactor`
- 勝手に commit / push しない。依頼されたときだけ行う

## GitHub 操作

- issue・PR・コメント・リポジトリ検索など GitHub 上のリソース操作は、GitHub MCP サーバーのツール（`mcp__github__*`）を使う。`gh` CLI や API の直接呼び出しは使わない
- MCP ツールが未ロードなら、`gh` にフォールバックせず先にツール検索で取得する
- owner / repo は推測せず、`git remote -v` で確認してから渡す
- ローカルの commit / branch / diff / push は通常の `git` でよい

### PR 説明欄

日本語の見出しで、最低限「変更内容」と「確認リスト」を書く。

```markdown
## 変更内容

- 何をどう変えたかを箇条書き（ファイル名・型名など具体名を含める）

## 確認リスト

- [x] 実施済みの検証（例: `pnpm typecheck` でエラーがないことを確認）
- [ ] レビュアーや自分が後から確認すべき項目
```

- 実施していない検証をチェック済みにしない
- 対応する issue があれば末尾に `Closes #番号` を付ける
- `pull_request_template.md` があればその構成を優先する

## 安全確認

- 破壊的な操作（ファイル削除、`git reset --hard`、force push、DB 変更など）は実行前に許可を求める
- **このリポジトリのファイルは、コミット済みのもの以外は復元できない**。未コミットのファイルを削除・上書きする前に、内容を確認する
- 自分が作成していないファイルを上書き・削除する前に、内容を確認する

## 報告

作業完了時は次の 3 点を伝える。

1. **変更内容の要約**
2. **検証結果**: 実行したコマンドとその結果。実行しなかった検証は明記する
3. **残課題**: 未対応の点、手動で確認すべき観点

テストの失敗やスキップした確認は、取り繕わずそのまま報告する。
