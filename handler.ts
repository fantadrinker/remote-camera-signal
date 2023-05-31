import {randomUUID} from 'crypto'
import { EventEmitter } from 'events'

interface Broadcast {
  broadcastId: string
  eventSource: EventEmitter
}

interface BroadcastSession {
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

export const newBroadcast = (broadcastId: string) => {
  if (Broadcasts[broadcastId]) {
    throw new Error('Broadcast already exists')
  }
  Broadcasts[broadcastId] = {
    broadcastId,
    eventSource: new EventEmitter(),
  }
  return Broadcasts[broadcastId].eventSource
}

export const deleteBroadcast = (broadcastId: string) => {
  delete Broadcasts[broadcastId]
}

export const newViewer = (broadcastId: string) => {
  const id = randomUUID()
  const broadcast = Object.keys(Broadcasts).find(key => Broadcasts[key].broadcastId === broadcastId)
  if (!broadcast) {
    throw new Error('Broadcast not found')
  }
  BroadcastSessions[id] = {
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

export const deleteViewer = (sessionId: string) => {
  delete BroadcastSessions[sessionId]
}

export const sendMessageToViewer = (sessionId: string, message: string) => {
  BroadcastSessions[sessionId].eventSource.emit('message', message)
}

export const sendMessageToBroadcaster = (sessionId: string, message: string) => {
  BroadcastSessions[sessionId].broadcastEventSource.emit('message', message)
}

