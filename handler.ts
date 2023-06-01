import { randomUUID } from 'crypto'
import { EventEmitter } from 'events'

interface Broadcast {
  wsid: string
  broadcastId: string
  eventSource: EventEmitter
}

interface BroadcastSession {
  wsid: string
  sessionId: string
  broadcastId: string
  viewerId: string
  eventSource: EventEmitter
  broadcastEventSource: EventEmitter
}
// map from websocket id to braodcast
const Broadcasts: Record<string, Broadcast> = {}

// map from viewer id to array of messages
const BroadcastSessions: Record<string, BroadcastSession> = {}

export const newBroadcast = (broadcastId: string, wsid: string) => {
  if (Broadcasts[broadcastId]) {
    throw new Error('Broadcast already exists')
  }
  Broadcasts[broadcastId] = {
    broadcastId,
    wsid,
    eventSource: new EventEmitter(),
  }
  return Broadcasts[broadcastId].eventSource
}

export const deleteBroadcast = (wsid: string) => {
  const broadcast = Object.keys(Broadcasts).find(
    key => Broadcasts[key].wsid === wsid
  )
  if (!broadcast) {
    console.error('Broadcast not found')
    return
  }
  delete Broadcasts[broadcast]
}

export const newViewer = (broadcastId: string, wsid: string) => {
  const id = randomUUID()
  const broadcast = Object.keys(Broadcasts).find(
    key => Broadcasts[key].broadcastId === broadcastId
  )
  if (!broadcast) {
    throw new Error('Broadcast not found')
  }
  BroadcastSessions[id] = {
    wsid,
    sessionId: id,
    broadcastId,
    viewerId: '',
    eventSource: new EventEmitter(),
    broadcastEventSource: Broadcasts[broadcast].eventSource,
  }
  return {
    id,
    eventSource: BroadcastSessions[id].eventSource,
  }
}

export const deleteViewer = (wsid: string) => {
  const viewer = Object.keys(BroadcastSessions).find(
    key => BroadcastSessions[key].wsid === wsid
  )
  if (!viewer) {
    console.error('Viewer not found')
    return
  }
  delete BroadcastSessions[viewer]
}

export const sendMessageToViewer = (sessionId: string, message: string) => {
  BroadcastSessions[sessionId].eventSource.emit('message', message)
}

export const sendMessageToBroadcaster = (
  sessionId: string,
  message: string
) => {
  BroadcastSessions[sessionId].broadcastEventSource.emit('message', message)
}
