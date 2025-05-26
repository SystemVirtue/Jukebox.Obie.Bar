import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    root: 'public',
    publicDir: 'public',
    define: {
      'import.meta.env.VITE_YOUTUBE_API_KEY': JSON.stringify(env.VITE_YOUTUBE_API_KEY || ''),
      'window.YOUTUBE_API_KEY': JSON.stringify(env.VITE_YOUTUBE_API_KEY || '')
    },
    plugins: [
      basicSsl(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(/%VITE_(\w+)%/g, (match, p1) => {
            return env[`VITE_${p1}`] || '';
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '/src': resolve(__dirname, 'src')
      },
      extensions: ['.ts', '.js', '.json']
    },
    server: {
      port: 3000,
      https: {},
      open: true,
      cors: {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'public/index.html')
        }
      }
    }
  };
});
