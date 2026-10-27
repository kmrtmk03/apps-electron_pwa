#!/usr/bin/env node
"use strict"

// PWA配信サーバー（electron/pwaServer）用に、mkcertでLAN内アクセス向けの
// 自己署名証明書（オレオレ証明書）を発行するスクリプト。
// Mac/Windows両方を "pnpm run pwa:cert" という同一コマンドでサポートするため、
// シェルスクリプトではなくNode.jsで実装している。
// 事前準備: mkcertをインストールしておくこと
//   Mac:     brew install mkcert nss
//   Windows: choco install mkcert （または scoop install mkcert）

const { execFileSync } = require("node:child_process")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")

const REPO_ROOT = path.join(__dirname, "..")
const CERT_DIR = path.join(REPO_ROOT, "certs")

/**
 * このPCのLAN内IPv4アドレスを取得する。
 * 仮想アダプタ（Docker Desktop / VPN等）による内部専用アドレスは対象外（internal: false のみ）とする。
 * 複数のネットワークインターフェースを持つ場合、最初に見つかったものを採用する
 *（展示PCのように接続先ネットワークが1つに固定されている運用を想定）。
 */
const getLanIPv4Address = () => {
  const interfaces = os.networkInterfaces()
  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) {
        return address.address
      }
    }
  }
  return null
}

/** mkcert がインストールされ、PATH から実行できる状態か確認する。 */
const isMkcertAvailable = () => {
  try {
    execFileSync("mkcert", ["-version"], { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

const main = () => {
  if (!isMkcertAvailable()) {
    console.error(
      "mkcert が見つかりません。事前にインストールしてください（Mac: brew install mkcert nss / Windows: choco install mkcert）。",
    )
    process.exitCode = 1
    return
  }

  const lanIp = getLanIPv4Address()
  if (lanIp === null) {
    console.error("LAN内のIPv4アドレスを取得できませんでした。ネットワークへの接続を確認してください。")
    process.exitCode = 1
    return
  }

  fs.mkdirSync(CERT_DIR, { recursive: true })

  const hostname = os.hostname()
  const certFile = path.join(CERT_DIR, "cert.pem")
  const keyFile = path.join(CERT_DIR, "key.pem")

  console.log("mkcertのローカルCAをこのPCの信頼済みストアへインストールします（初回のみ実際に変更されます）...")
  execFileSync("mkcert", ["-install"], { stdio: "inherit" })

  console.log(`証明書を発行します: IP=${lanIp}, hostname=${hostname}`)
  execFileSync(
    "mkcert",
    ["-cert-file", certFile, "-key-file", keyFile, lanIp, hostname, "localhost", "127.0.0.1", "::1"],
    { stdio: "inherit" },
  )

  console.log("")
  console.log(`証明書を生成しました: ${certFile}, ${keyFile}`)
  console.log("")
  console.log("スマートフォン側のブラウザで「安全な接続」として扱わせるには、")
  console.log("mkcertのルートCA証明書を端末に転送し、信頼済み証明書としてインストールする必要があります。")
  console.log("ルートCA証明書の場所:")
  execFileSync("mkcert", ["-CAROOT"], { stdio: "inherit" })
  console.log("")
  console.log(
    "※ LANのIPアドレスが変わった場合（Wi-Fi再接続・別ネットワークへの移動等）は、このスクリプトを再実行してください。",
  )
}

main()
