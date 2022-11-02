export default {
  build: {
    sourcemap: true,
    outDir: "../open_layers_viewer/web",
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
    },
  }
}
