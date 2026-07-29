import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Mirrors the production build: mounted at /vrcc/app/, with the same vendor
// chunk split observed in the deployed bundles (vendor-react, vendor-charts,
// vendor-supabase, vendor-ui, vendor-motion, vendor-three).
export default defineConfig({
  base: '/vrcc/app/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'vendor-charts';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('three')) return 'vendor-three';
          if (id.includes('lucide-react') || id.includes('@radix-ui')) return 'vendor-ui';
        },
      },
    },
  },
});
