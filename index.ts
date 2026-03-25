import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import connectDb from './src/config/connectDb.js'
import authRoutes from './src/routes/authRoutes.js'
import aiRoutes from './src/routes/aiRoutes.js'

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } })
})

app.use('/api/auth', authRoutes)
app.use('/api/ai', aiRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } })
})

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.statusCode || 500
  const message = err.expose ? err.message : 'Internal server error'

  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message,
    },
  })
})

const port = process.env.PORT || 5000

connectDb()
  .then(() => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`API listening on port ${port}`)
    })
  })
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('DB connection failed', e)
    process.exit(1)
  })
