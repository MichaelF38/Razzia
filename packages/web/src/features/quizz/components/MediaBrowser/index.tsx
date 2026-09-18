import { EVENTS, LOCAL_MEDIA_PREFIX } from "@razzia/common/constants"
import type {
    MediaEntry,
    MediaListing,
    QuestionMediaType,
} from "@razzia/common/types/game"
import {
    useEvent,
    useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import {
    Folder,
    Home,
    ImageOff,
    Loader2,
    Music,
    Video,
    X,
} from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

interface Props {
  onSelect: (_media: { type: QuestionMediaType; url: string }) => void
  onClose: () => void
}

const toMediaUrl = (path: string): string =>
  LOCAL_MEDIA_PREFIX + path.split("/").map(encodeURIComponent).join("/")

const MediaBrowser = ({ onSelect, onClose }: Props) => {
  const { socket } = useSocket()
  const { t } = useTranslation()
  const [currentPath, setCurrentPath] = useState("")
  const [listing, setListing] = useState<MediaListing | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    socket.emit(EVENTS.MEDIA.LIST, currentPath)
  }, [socket, currentPath])

  useEvent(EVENTS.MEDIA.DATA, (data) => {
    setListing(data)
    setIsLoading(false)
  })

  useEvent(EVENTS.MEDIA.ERROR, (message) => {
    toast.error(t(message))
    setIsLoading(false)
  })

  const breadcrumbs = currentPath === "" ? [] : currentPath.split("/")

  const handleSelectFile = (entry: MediaEntry) => {
    if (!entry.type) {
      return
    }

    onSelect({ type: entry.type, url: toMediaUrl(entry.path) })
  }

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-accent flex shrink-0 items-center justify-between gap-3 border-b-2 px-5 py-3">
          <h2 className="text-foreground truncate text-base font-bold">
            {t("quizz:question.mediaBrowser.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted hover:text-accent-foreground rounded p-1"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="border-accent flex shrink-0 flex-wrap items-center gap-1 border-b-2 px-5 py-2 text-sm">
          <button
            onClick={() => setCurrentPath("")}
            className="text-accent-foreground flex items-center gap-1 hover:underline"
          >
            <Home className="size-4" />
            {t("quizz:question.mediaBrowser.root")}
          </button>
          {breadcrumbs.map((segment, index) => (
            <span key={segment + index} className="flex items-center gap-1">
              <span className="text-muted-foreground">/</span>
              <button
                onClick={() =>
                  setCurrentPath(breadcrumbs.slice(0, index + 1).join("/"))
                }
                className="text-accent-foreground hover:underline"
              >
                {segment}
              </button>
            </span>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="text-muted-foreground size-8 animate-spin" />
            </div>
          )}

          {!isLoading && listing?.entries.length === 0 && (
            <div className="text-muted-foreground flex h-32 flex-col items-center justify-center gap-2 text-center text-sm">
              <ImageOff className="size-8" />
              {t("quizz:question.mediaBrowser.empty")}
            </div>
          )}

          {!isLoading && listing && listing.entries.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {listing.entries.map((entry) => (
                <button
                  key={entry.path}
                  onClick={() =>
                    entry.kind === "directory"
                      ? setCurrentPath(entry.path)
                      : handleSelectFile(entry)
                  }
                  className="border-accent hover:border-primary flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-center"
                >
                  {entry.kind === "directory" && (
                    <Folder className="text-accent-foreground size-10" />
                  )}
                  {entry.kind === "file" && entry.type === "image" && (
                    <img
                      src={toMediaUrl(entry.path)}
                      alt=""
                      className="h-10 w-full rounded object-cover"
                    />
                  )}
                  {entry.kind === "file" && entry.type === "video" && (
                    <Video className="text-accent-foreground size-10" />
                  )}
                  {entry.kind === "file" && entry.type === "audio" && (
                    <Music className="text-accent-foreground size-10" />
                  )}
                  <span className="text-foreground w-full truncate text-xs">
                    {entry.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MediaBrowser
