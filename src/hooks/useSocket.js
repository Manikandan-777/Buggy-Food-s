import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

let socket = null

function getSocket() {
    if (!socket) {
        socket = io(SOCKET_URL, { autoConnect: false })
    }
    return socket
}

/**
 * Subscribe to a Socket.io event
 * @param {string} event - event name
 * @param {Function} handler - callback function
 * @param {boolean} enabled - only connect if true (e.g. admin is logged in)
 */
export function useSocket(event, handler, enabled = true) {
    const handlerRef = useRef(handler)
    handlerRef.current = handler

    useEffect(() => {
        if (!enabled) return

        const s = getSocket()
        if (!s.connected) s.connect()

        const cb = (...args) => handlerRef.current(...args)
        s.on(event, cb)

        return () => {
            s.off(event, cb)
        }
    }, [event, enabled])
}

export function disconnectSocket() {
    socket?.disconnect()
    socket = null
}
