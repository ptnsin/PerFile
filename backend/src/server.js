import express from 'express'
import cors from 'cors'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

import authRouter from './routers/authRouter.js'
import adminRouter from './routers/adminRouter.js'
import resumeRouter from './routers/resumeRouter.js'
import fileRouter from './routers/fileRouter.js'
import socialRouter from './routers/socialRouter.js'
import hrRouter from './routers/hrRouter.js'
// import notificationRouter from './routers/notificationRouter.js'
// import shareRouter from './routers/shareRouter.js'

const HOST = 'localhost'
const PORT = 3000

const app = express()

app.use(cors())
app.use(express.json())

// ── Swagger setup ──────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title      : 'PerFile API',
      version    : '1.0.0',
      description: 'PerFile',
    },
    servers: [{ url: `http://${HOST}:${PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type        : 'http',
          scheme      : 'bearer',
          bearerFormat: 'JWT',
        }
      }
    }
  },
  apis: ['./src/routers/*.js'],  // อ่าน comment จากทุก router
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
// ───────────────────────────────────────────────

// -------- 67118401 ปฏิภาณ 8 API ---------
app.use('/auth', authRouter)

// -------- 67122203 ศิววงศ์ 9 API ---------
app.use('/admin', adminRouter)


// -------- 67114610 กองทัพ 8 API ---------
 app.use('/resumes', resumeRouter)

// -------- 67162470 พงศกร 6 API ---------
app.use('/files', fileRouter)

// -------- 67178847 ภัทรนันท์ 12 API---------
app.use('/social', socialRouter)
app.use('/hr', hrRouter)

// -------- 67162470 พงศกร 4 API ---------
// app.use('/notifications', notificationRouter)

// ---67118401 ปฏิภาณ(POST,DELETE) / 67114610 กองทัพ (GET)
// app.use('/share', shareRouter)


app.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`)
})