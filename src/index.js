import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import bodyParser from 'body-parser'
import { supabase } from './config/supabase.js'
// import cookieParser from 'cookie-parser'

import router from './router.js'
import dotenv from 'dotenv'
import session from 'express-session'
import { rateLimit } from 'express-rate-limit'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3000

const ROOT_DOMAIN =
    process.env.NODE_ENV === 'production'
        ? process.env.PROD_DOMAIN
        : process.env.DEV_DOMAIN
const STATIC_DIR =
    process.env.NODE_ENV === 'production'
        ? process.env.PROD_STATIC
        : process.env.DEV_STATIC

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Use an external store for consistency across multiple server instances.
})

const cspPolicy = `default-src ${ROOT_DOMAIN}; script-src ${ROOT_DOMAIN}; style-src ${ROOT_DOMAIN} https://fonts.googleapis.com; img-src ${ROOT_DOMAIN} https://i.postimg.cc; font-src https://fonts.gstatic.com ${process.env.PROD_DOMAIN} data:;`
app.set('trust proxy', 1)

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, STATIC_DIR)))
app.use(express.urlencoded({ extended: true }))
// IMPORTANT: raw body for webhook must run before express.json()
app.use('/stripe-webhook', bodyParser.raw({ type: 'application/json' }))

app.use(express.json())

app.use(
    session({
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
    })
)

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

// Rendered view route
app.use('/', router)

// Catch-all route for any undefined paths - replace with fallback view
app.all('/*fallback', (req, res) => {
    res.status(404).send(
        '404 Not Found: The requested URL was not found on this server.'
    )
})
// Start the server
app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`)
})
