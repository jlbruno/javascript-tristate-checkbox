// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'tristate-checkbox.js'),
      name: 'TristateCheckbox',
      fileName: (format) => {
        if (format === 'umd') return 'tristate-checkbox.min.js';
        if (format === 'es') return 'tristate-checkbox.esm.js';
        return `tristate-checkbox.${format}.js`;
      },
      formats: ['es', 'umd'],
    },
    outDir: '',
    minify: true,
    sourcemap: true,
  },
  server: {
    open: '/checkboxes.html',
  },
});