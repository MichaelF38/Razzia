import { MEDIA_EXTENSIONS } from "@razzia/common/constants"
import type { MediaEntry, MediaListing } from "@razzia/common/types/game"
import { getPath } from "@razzia/socket/services/config"
import fs from "fs"
import path from "path"

// Splits a client-supplied posix-style path into safe segments, rejecting
// anything that could escape the media root (`..`, absolute paths, empty parts).
const toSafeSegments = (relativePath: string): string[] => {
  const normalized = path.posix.normalize(relativePath).replace(/^\/+/u, "")

  if (normalized === "." || normalized === "") {
    return []
  }

  const segments = normalized.split("/")

  if (segments.some((segment) => segment === "" || segment === "..")) {
    throw new Error("Invalid media path")
  }

  return segments
}

const resolveMediaDir = (relativePath: string): { dir: string; segments: string[] } => {
  const root = path.resolve(getPath("media"))
  const segments = toSafeSegments(relativePath)
  const dir = path.resolve(root, ...segments)

  if (dir !== root && !dir.startsWith(root + path.sep)) {
    throw new Error("Invalid media path")
  }

  return { dir, segments }
}

export const listMedia = (relativePath: string): MediaListing => {
  const { dir, segments } = resolveMediaDir(relativePath)

  if (!fs.existsSync(dir)) {
    throw new Error("Media folder not found")
  }

  // withFileTypes + isSymbolicLink (not stat) so a symlink is skipped rather than followed outside the media root
  const dirents = fs.readdirSync(dir, { withFileTypes: true })

  const entries: MediaEntry[] = dirents
    .filter((dirent) => !dirent.name.startsWith(".") && !dirent.isSymbolicLink())
    .flatMap((dirent) => {
      const entryPath = [...segments, dirent.name].join("/")

      if (dirent.isDirectory()) {
        return [{ name: dirent.name, path: entryPath, kind: "directory" as const }]
      }

      if (!dirent.isFile()) {
        return []
      }

      const type = MEDIA_EXTENSIONS[path.extname(dirent.name).toLowerCase()]

      if (!type) {
        return []
      }

      return [{ name: dirent.name, path: entryPath, kind: "file" as const, type }]
    })
    .sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === "directory" ? -1 : 1
      }

      return a.name.localeCompare(b.name)
    })

  return {
    path: segments.join("/"),
    parent: segments.length > 0 ? segments.slice(0, -1).join("/") : null,
    entries,
  }
}
