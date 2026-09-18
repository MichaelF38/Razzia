import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import fs from "node:fs"
import type { IncomingMessage, ServerResponse } from "node:http"
import path from "node:path"
import { fileURLToPath } from "url"
import { defineConfig, type Plugin } from "vite"
import { version } from "../../package.json"

const brandingDir = fileURLToPath(
  new URL("../../config/branding", import.meta.url),
)

const mediaDir = fileURLToPath(new URL("../../config/media", import.meta.url))

const mimeTypes: Record<string, string> = {
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
}

/** Builds a middleware serving `dir` under `urlPrefix`, with Range support for video/audio seeking. */
const serveConfigDir =
  (urlPrefix: string, dir: string) =>
  (req: IncomingMessage, res: ServerResponse, next: () => void): void => {
    if (!req.url?.startsWith(urlPrefix)) {
      next()

      return
    }

    const [rawRelative] = req.url.slice(urlPrefix.length).split("?")
    let relative: string

    try {
      relative = decodeURIComponent(rawRelative)
    } catch {
      res.statusCode = 400
      res.end()

      return
    }

    const filePath = path.join(dir, relative)

    if (filePath !== dir && !filePath.startsWith(dir + path.sep)) {
      res.statusCode = 404
      res.end()

      return
    }

    let stat: fs.Stats

    try {
      stat = fs.statSync(filePath)
    } catch {
      res.statusCode = 404
      res.end()

      return
    }

    if (!stat.isFile()) {
      res.statusCode = 404
      res.end()

      return
    }

    const contentType =
      mimeTypes[path.extname(filePath).toLowerCase()] ??
      "application/octet-stream"
    const range = req.headers.range
    const rangeMatch = range ? /^bytes=(\d*)-(\d*)$/u.exec(range) : null

    if (range && rangeMatch) {
      const start = rangeMatch[1] ? Number(rangeMatch[1]) : 0
      const end = rangeMatch[2] ? Number(rangeMatch[2]) : stat.size - 1

      if (start > end || end >= stat.size) {
        res.statusCode = 416
        res.setHeader("Content-Range", `bytes */${stat.size}`)
        res.end()

        return
      }

      res.statusCode = 206
      res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`)
      res.setHeader("Content-Length", end - start + 1)
      res.setHeader("Accept-Ranges", "bytes")
      res.setHeader("Content-Type", contentType)
      fs.createReadStream(filePath, { start, end }).pipe(res)

      return
    }

    res.setHeader("Content-Type", contentType)
    res.setHeader("Accept-Ranges", "bytes")
    res.setHeader("Content-Length", stat.size)
    fs.createReadStream(filePath).pipe(res)
  }

const serveBranding = serveConfigDir("/branding/", brandingDir)
const serveMedia = serveConfigDir("/media/", mediaDir)

const serveConfigDirs = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): void => {
  serveBranding(req, res, () => serveMedia(req, res, next))
}

/** Serves the optional `config/branding` and `config/media` folders in `vite dev` and `vite preview` (nginx does this in prod). */
const configDirServer = (): Plugin => ({
  name: "razzia-config-dir-server",
  configureServer(server) {
    server.middlewares.use(serveConfigDirs)
  },
  configurePreviewServer(server) {
    server.middlewares.use(serveConfigDirs)
  },
})

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    tanstackRouter({
      target: "react",
      routeToken: "layout",
      routesDirectory: "./src/pages",
      generatedRouteTree: "./src/route.gen.ts",
    }),
    react(),
    tailwindcss(),
    configDirServer(),
  ],
  resolve: {
    alias: {
      "@razzia/web": fileURLToPath(new URL("./src", import.meta.url)),
      "@razzia/common": fileURLToPath(
        new URL("../common/src", import.meta.url),
      ),
      "@razzia/socket": fileURLToPath(
        new URL("../socket/src", import.meta.url),
      ),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    proxy: {
      "/ws": {
        target: "http://localhost:3001",
        ws: true,
      },
    },
  },
  preview: {
    port: 3000,
    host: "0.0.0.0",
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
})
