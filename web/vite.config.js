import { defineConfig } from "vite"

export default defineConfig(({command, mode}) => {
  return {
    publicDir: 'public',
    build: {
      sourcemap: true,
      outDir: "../open_layers_viewer/web",
      minify: false,
      emptyOutDir: false,
      rollupOptions: {
        output: {
          entryFileNames: `[name].js`,
          chunkFileNames: `[name].js`,
          assetFileNames: `[name].[ext]`,
        },
      },
    }
  }
})
