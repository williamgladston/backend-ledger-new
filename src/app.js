const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const requestLogger = require("./middleware/logger.middleware")
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware")

const app = express()

/**
 * Build the list of allowed origins for CORS.
 * - Defaults to the Vite dev server (http://localhost:5173).
 * - FRONTEND_URL may be a single origin or a comma-separated list of origins
 *   for staging/production deployments.
 */
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser requests (curl, server-to-server) which send no Origin header.
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin)) return callback(null, true)
        return callback(new Error(`CORS: origin '${origin}' not allowed`))
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type", "Authorization"],
    // Cache the preflight result for an hour in the browser so the round-trip
    // isn't paid on every request.
    maxAge: 3600,
}))

app.use(express.json({ limit: "1mb" }))
app.use(cookieParser())
app.use(requestLogger)

/**
 * Routes
 */
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.routes")

app.get("/", (req, res) => {
    res.json({ status: "ok", service: "ledger" })
})

app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)

/**
 * Error handlers must be the last things mounted.
 *  - notFoundHandler responds 404 for unknown routes (with CORS headers so
 *    the browser doesn't blame CORS).
 *  - errorHandler catches anything that next(err) forwards — including
 *    rejections from async controllers wrapped in asyncHandler.
 */
app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
