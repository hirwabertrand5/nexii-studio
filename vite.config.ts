import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = __dirname.replace(/\\/g, "/")

function resolveWatchPath(filePath: string) {
  const normalizedPath = filePath.replace(/\\/g, "/")
  if (normalizedPath.startsWith("/")) {
    return normalizedPath
  }

  return `${projectRoot}/${normalizedPath.replace(/^\.?\//, "")}`
}

function shouldIgnoreWatchPath(filePath: string) {
  const normalizedPath = resolveWatchPath(filePath)

  if (normalizedPath.includes("/node_modules/")) return true
  if (normalizedPath.includes("/dist/")) return true
  if (normalizedPath.includes("/server/")) return true
  if (normalizedPath.includes("/.git/")) return true
  if (normalizedPath.includes("/.env")) return true
  if (normalizedPath.endsWith("/.gitignore")) return true
  if (normalizedPath.endsWith(".md")) return true
  if (normalizedPath.endsWith(".lock")) return true
  if (normalizedPath.endsWith(".log")) return true
  if (normalizedPath.endsWith(".map")) return true
  if (normalizedPath.endsWith(".tsbuildinfo")) return true

  if (normalizedPath.startsWith(`${projectRoot}/src/`)) return false
  if (normalizedPath.startsWith(`${projectRoot}/public/`)) return false

  const rootFileName = normalizedPath.slice(projectRoot.length + 1)
  return ![
    "index.html",
    "package.json",
    "tsconfig.json",
    "postcss.config.mjs",
    "vite.config.ts"
  ].includes(rootFileName)
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "localhost",
    port: 3001,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups"
    },
    watch: {
      usePolling: true,
      interval: 1500,
      ignored: shouldIgnoreWatchPath
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
})
