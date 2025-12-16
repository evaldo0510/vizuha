import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variaveis de ambiente (Vercel injeta API_KEY)
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Garante que process.env.API_KEY funcione no navegador após o build
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});