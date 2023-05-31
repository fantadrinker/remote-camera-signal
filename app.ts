import express, { Request, Response } from 'express'
import https from 'https'
import fs from 'fs'
import {Server as WSServer} from 'ws'
import 'dotenv/config'

const app = express()
const port = process.env.PORT || 3000


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
  const privateKey = fs.readFileSync('/etc/ssl/certs/lws-sig-serv.key', 'utf8')
  const certificate = fs.readFileSync('/etc/ssl/certs/lws-sig-serv.crt', 'utf8')
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
    switch (ws.protocol) {
      case 'echo-protocol':
        console.log('echo-protocol')
        break
      case 'broadcast-protocol':
        console.log('broadcast-protocol')
        break
      case 'viewer-protocol':
        console.log('viewer-protocol')
        break
      default:
        console.log('default')
        break
    ws.send(JSON.stringify({ message: 'Hello from server!' }))
    ws.on('message', msg => {
      console.log('Client said: ' + msg.toString());
    })
  });
  wss.on('message', msg => {
    console.log('Client said: ' + msg.toString());
  });
} else {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}