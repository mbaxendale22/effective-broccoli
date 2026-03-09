import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import bodyParser from 'body-parser'
// import cookieParser from 'cookie-parser'
import { getCurrentWebstoreStatus } from './api/operationalStatus.js'
import { RedisStore } from 'connect-redis'
import { createClient } from 'redis'

import router from './router.js'
import dotenv from 'dotenv'
import session from 'express-session'
import { rateLimit } from 'express-rate-limit'

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'

const getMissingEnvVars = () => {
    const requiredEnvVars = [
        'SESSION_SECRET',
        'SUPABASE_URL',
        'SUPABASE_SERVER_SECRET_KEY',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
    ]

    return requiredEnvVars.filter((key) => !process.env[key])
}

const missingEnvVars = getMissingEnvVars()

if (missingEnvVars.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`
    )
}

// ...existing code...
const createSessionStore = async () => {
    if (!process.env.REDIS_URL) {
        console.warn(
            'REDIS_URL is not set. Using in-memory session store (not recommended for production).'
        )
        return null
    }

    const redisUrl = process.env.REDIS_URL
    const useTls = redisUrl.startsWith('rediss://')

    const redisClient = createClient({
        url: redisUrl,
        socket: useTls
            ? {
                  tls: true,
                  rejectUnauthorized: false,
              }
            : undefined,
    })

    redisClient.on('error', (error) => {
        console.error('Redis session client error:', error)
    })

    await redisClient.connect()

    return new RedisStore({
        client: redisClient,
        prefix: 'fourways:sess:',
    })
}

const sessionStore = await createSessionStore()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3000

const ROOT_DOMAIN = isProduction
    ? process.env.PROD_DOMAIN || ''
    : process.env.DEV_DOMAIN || ''
const STATIC_DIR = isProduction
    ? process.env.PROD_STATIC || 'public'
    : process.env.DEV_STATIC || 'public'

const defaultSrcValues = ["'self'"]

if (ROOT_DOMAIN) {
    defaultSrcValues.push(ROOT_DOMAIN)
}

const defaultSrc = defaultSrcValues.join(' ')

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    skip: (req) => req.path.startsWith('/stripe-webhook'),
    // store: ... , // Use an external store for consistency across multiple server instances.
})

const cspPolicy = `default-src ${defaultSrc}; script-src ${defaultSrc}; style-src ${defaultSrc} https://fonts.googleapis.com; img-src ${defaultSrc} https://i.postimg.cc data:; font-src https://fonts.gstatic.com ${defaultSrc} data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';`
app.set('trust proxy', 1)

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, STATIC_DIR)))
app.use(express.urlencoded({ extended: true, limit: '100kb' }))
// IMPORTANT: raw body for webhook must run before express.json()
app.use('/stripe-webhook', bodyParser.raw({ type: 'application/json' }))

app.use(express.json({ limit: '100kb' }))

const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'fourways.admin.sid',
    cookie: {
        httpOnly: true,
        secure: 'auto',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
}

if (sessionStore) {
    sessionConfig.store = sessionStore
}

app.use(session(sessionConfig))

// Apply the rate limiting middleware to all requests.
app.use(limiter)

app.use((req, res, next) => {
    res.set('Content-Security-Policy', cspPolicy)
    next()
})

// request logger
app.use((req, _res, next) => {
    console.log(`incoming ${req.method} request to ${req.url}`)
    next()
})

app.use(async (_req, res, next) => {
    try {
        const webstoreStatus = await getCurrentWebstoreStatus()
        res.locals.webstoreStatus = webstoreStatus
        res.locals.isWebstoreInMaintenance = webstoreStatus === 'MAINTENANCE'
        next()
    } catch (error) {
        next(error)
    }
})

// Rendered view route
app.use('/', router)

// Catch-all route for any undefined paths - replace with fallback view
app.all('/*fallback', (req, res) => {
    res.status(404).send(
        '404 Not Found: The requested URL was not found on this server.'
    )
})

app.use((error, req, res, next) => {
    console.error('Unhandled server error:', {
        message: error?.message,
        path: req.originalUrl,
        method: req.method,
        stack: isProduction ? undefined : error?.stack,
    })

    if (res.headersSent) {
        return next(error)
    }

    return res.status(500).send('Internal Server Error')
})

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason)
})

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error)
    process.exit(1)
})

// Start the server
app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`)
})
