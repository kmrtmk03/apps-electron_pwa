import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    // 開発サーバーは開発PCからのみアクセスできる IPv4 ループバックへ固定する。
    // OS の名前解決で ::1 のみへ待ち受けると、127.0.0.1 から接続できなくなるため明示する。
    host: '127.0.0.1',
    port: 5432,
    // PWA の開発サーバーから Electron の API へ転送する。
    // ブラウザは /api/message を同一オリジンへのリクエストとして扱うため、
    // PWA 側で CORS 設定や Electron の LAN IP を意識する必要がない。
    proxy: {
      '/api/message': {
        target: 'https://localhost:5180',
        changeOrigin: true,
        // Electron の PWA サーバーは mkcert 証明書を使うため、
        // 開発プロキシからの接続時は証明書検証を行わない。
        secure: false,
      },
    },
  },
  preview: {
    port: 5432,
  },
  plugins: [
    react(),
    VitePWA({
      // 開発中もローカルで Service Worker の挙動を確認できるようにする
      devOptions: {
        enabled: true,
      },
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'pwa-test',
        short_name: 'pwa-test',
        description: 'Vite + React + PWA project base',
        theme_color: '#005aaf',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
