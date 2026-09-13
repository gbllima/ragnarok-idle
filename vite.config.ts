import { defineConfig } from 'vite'

export default defineConfig({
  build:{target:'es2022'},
  server:{proxy:{'/ro/monster-actions':{target:'http://localhost:8787',changeOrigin:true}}},
})
