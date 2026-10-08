import {defineConfig} from 'vite';
import {reactRouter} from '@react-router/dev/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';
import {localHttps} from '@shopify/hydrogen/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const oxygenPlugins = oxygen();

export default defineConfig({
  plugins: [
    localHttps({enabled: process.env.npm_lifecycle_event === 'dev:https'}),
    ...oxygenPlugins,
    {
      name: 'pin-oxygen-compatibility-date',
      configResolved() {
        const oxygenMain = oxygenPlugins.find(
          (plugin) => plugin.name === 'oxygen:main',
        );
        oxygenMain?.api?.registerPluginOptions({
          compatibilityDate: '2026-04-01',
        });
      },
    },
    reactRouter(),
    tsconfigPaths(),
  ],
  build: {
    // Allow a strict Content-Security-Policy
    // without inlining assets as base64:
    assetsInlineLimit: 0,
  },
  ssr: {
    optimizeDeps: {
      include: [
        'typographic-base',
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'react-dom/server',
        'react-router',
        'react-router > cookie',
        'react-router > set-cookie-parser',
      ],
    },
  },
  optimizeDeps: {
    include: [
      'clsx',
      '@headlessui/react',
      'typographic-base',
      'react-intersection-observer',
      'react-use/esm/useScroll',
      'react-use/esm/useDebounce',
      'react-use/esm/useWindowScroll',
    ],
  },
});
