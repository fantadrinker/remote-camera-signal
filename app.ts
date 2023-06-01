import express, { Request, Response } from 'express'
import https from 'https'
import fs from 'fs'
import { Server as WSServer } from 'ws'
import 'dotenv/config'
import { randomUUID } from 'crypto'
import {
  newBroadcast,
  newViewer,
  sendMessageToViewer,
  sendMessageToBroadcaster,
  deleteViewer,
  deleteBroadcast,
} from './handler'

const app = express()
const port = process.env.PORT || 3000

const BROADCASTER_INIT = 0
const BROADCASTER_MESSAGE = 1
const VIEWER_JOIN = 2
const VIEWER_MESSAGE = 3

const array: Array<number> = []

function delay(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!')
})

app.post('/numbers/:number', async (req, res) => {
  const number = parseInt(req.params.number)
  const delayTime = Math.random() * 1000
  await delay(delayTime)
  array.push(number)
  res.send(`Added ${number} to array`)
})

app.get('/numbers', (req, res) => {
  res.send(array)
})

if (process.env.ENABLE_HTTPS) {
  const sslPath = process.env.SSL_PATH || '/etc/ssl/certs'
  const privateKey = fs.readFileSync(`${sslPath}/lws-sig-serv.key`, 'utf8')
  const certificate = fs.readFileSync(`${sslPath}/lws-sig-serv.crt`, 'utf8')
  const credentials = { key: privateKey, cert: certificate }
  const httpsServer = https.createServer(credentials, app)
  httpsServer.listen(443, () => {
    console.log('HTTPS Server running on port 443')
  })

  const wss = new WSServer({
    server: httpsServer,
  })
  wss.on('connection', ws => {
    console.log('Client connected.')
    const wsid = randomUUID()
    switch (ws.protocol) {
      case 'echo-protocol':
        console.log('echo-protocol')
        break
      case 'broadcast-protocol':
        ws.on('message', msg => {
          const msgObj = JSON.parse(msg.toString())
          try {
            switch (msgObj.message_type) {
              case BROADCASTER_INIT:
                console.log('creating broadcast', msgObj.broadcast_id)
                const eventListener = newBroadcast(msgObj.broadcast_id, wsid)
                eventListener.on('message', msg => {
                  console.log(`broadcaster event fired, ${ws.readyState}`)
                  console.log(msg)
                  ws.send(msg)
                })
                ws.send(
                  JSON.stringify({
                    message_type: 'broadcast_created',
                    broadcast_id: msgObj.broadcast_id,
                  })
                )
                break
              case BROADCASTER_MESSAGE:
                console.log('broadcaster-message')
                const { session_id } = msgObj
                // fire an event to send message to viewer
                sendMessageToViewer(session_id, msg.toString())
                // Find viewer session
                ws.send(
                  JSON.stringify({ message_type: 'broadcast_message_queued' })
                )
                break
              default:
                console.log('unrecognized message type')
                break
            }
          } catch (error) {
            console.log(error)
            ws.send(JSON.stringify({ message_type: 'error', error }))
          }
        })
        ws.on('close', () => {
          console.log('viewer connection closed')
          deleteBroadcast(wsid)
        })
        break
      case 'viewer-protocol':
        // create viewer session
        console.log('viewer-protocol')
        ws.on('message', msg => {
          const msgObj = JSON.parse(msg.toString())
          try {
            switch (msgObj.message_type) {
              case VIEWER_JOIN:
                console.log('new viewer for broadcast', msgObj.broadcast_id)
                const { id, eventSource } = newViewer(msgObj.broadcast_id, wsid)
                ws.send(
                  JSON.stringify({ message_type: 'session_created', payload: id })
                )
                eventSource.on('message', msg => {
                  console.log(`viewer event fired, ${ws.readyState}`)
                  console.log(msg)
                  ws.send(msg)
                })
                break
              case VIEWER_MESSAGE:
                console.log('viewer-message')
                const { session_id } = msgObj
                sendMessageToBroadcaster(session_id, msg.toString())
                ws.send(JSON.stringify({ message_type: 'viewer_message_queued' }))
                break
              default:
                console.log('unrecognized message type')
                break
            }
          } catch (error) {
            console.log(error)
            ws.send(JSON.stringify({ message_type: 'error', error }))
          }
        })
        ws.on('close', () => {
          console.log('viewer connection closed')
          deleteViewer(wsid)
        })
        break
      default:
        console.log('default')
        break
    }
  })
} else {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}
