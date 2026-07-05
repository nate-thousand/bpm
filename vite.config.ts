import { defineConfig } from "vite"
import { resolve } from "node:path"

export default defineConfig({
  root: ".",
  server: {
    host: true,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        styleguide: resolve(__dirname, "styleguide.html"),
        artDirection: resolve(__dirname, "art-direction.html"),
        uiPrinciples: resolve(__dirname, "ui-principles.html"),
        readme: resolve(__dirname, "readme.html"),
        roadmap: resolve(__dirname, "roadmap.html"),
      },
    },
  },
})
