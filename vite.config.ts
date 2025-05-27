import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  
  return {
    root: 'public',
    publicDir: 'public',
    base: '/', // Ensure base URL is set correctly for production
    define: {
      'import.meta.env.VITE_YOUTUBE_API_KEY': JSON.stringify(env.VITE_YOUTUBE_API_KEY || ''),
      'window.YOUTUBE_API_KEY': JSON.stringify(env.VITE_YOUTUBE_API_KEY || '')
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      sourcemap: !isProduction,
      minify: isProduction ? 'esbuild' : false,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'public/react-index.html'),
          jukebox: resolve(__dirname, 'public/react-jukebox.html'),
          player: resolve(__dirname, 'public/react-player.html'),
          admin: resolve(__dirname, 'public/admin/react-index.html')
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            youtube: ['youtube-player/dist/index'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    plugins: [
      !isProduction && basicSsl(),
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
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'],
      alias: [
        { find: '@', replacement: resolve(__dirname, 'src') },
        { find: '/src', replacement: resolve(__dirname, 'src') }
      ]
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      esbuildOptions: {
        loader: { '.ts': 'tsx' }
      }
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
    }
  };
});
