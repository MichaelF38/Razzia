import { EVENTS } from "@razzia/common/constants"
import type { SocketContext } from "@razzia/socket/handlers/types"
import manager from "@razzia/socket/services/manager"
import { listMedia } from "@razzia/socket/services/media"

export const mediaSocketHandlers = ({ socket }: SocketContext) => {
  socket.on(
    EVENTS.MEDIA.LIST,
    manager.withAuth(socket, (path) => {
      try {
        const listing = listMedia(path)

        socket.emit(EVENTS.MEDIA.DATA, listing)
      } catch (error) {
        console.error("Failed to list media:", error)
        socket.emit(EVENTS.MEDIA.ERROR, "errors:media.failedToList")
      }
    }),
  )
}
