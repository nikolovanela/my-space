import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Во развој, /api барањата одат до ASP.NET Core на порта 5080.
// host: true значи дека можеш да ја отвориш и од телефон на истата Wi-Fi мрежа.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: { '/api': 'http://localhost:5080' },
  },
  build: {
    outDir: '../backend/MySpace.Api/wwwroot',
    emptyOutDir: true,
  },
});
