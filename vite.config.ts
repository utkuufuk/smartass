import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/smartass',
  build: {
    outDir: './docs',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.includes('https://content.googleapis.com/calendar/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Smartass',
        short_name: 'Smartass',
        description: 'A smart assistant that schedules your day-to-day activities.',
        theme_color: '#ffffff',
        icons: [
          {
            src: '192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '256x256.png',
            sizes: '256x256',
            type: 'image/png',
          },
          {
            src: '512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
