/**
 * Centralised error responses. Mounted LAST in src/app.js so it catches
 * anything asyncHandler forwards via next(err).
 *
 * Important: every response from this middleware must include the same
 * CORS headers as a normal response, otherwise the browser reports the
 * error as a CORS failure instead of a real 4xx/5xx. We re-emit the
 * Access-Control-Allow-Origin header here so a thrown error never
 * silently fails the preflight.
 */
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)

function setCorsHeader(req, res) {
    const origin = req.headers.origin
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin)
        res.setHeader("Access-Control-Allow-Credentials", "true")
    }
}

function notFoundHandler(req, res, next) {
    setCorsHeader(req, res)
    res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`
    })
}

/**
 * Wraps an async route handler so any thrown / rejected error is
 * forwarded to the Express error-handling middleware via next(err).
 *
 * Without this, a rejection inside an async controller becomes an
 * UnhandledPromiseRejection that Express never sees — the response
 * hangs or, worse, the server returns a response with no CORS headers
 * (because the CORS headers are set in app.js's normal flow, which
 * never runs on an unhandled rejection), which the browser reports as
 * a CORS failure even though the root cause is something else entirely.
 */
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    setCorsHeader(req, res)

    // Mongoose validation error
    if (err && err.name === "ValidationError") {
        return res.status(400).json({
            message: "Validation failed",
            details: Object.values(err.errors || {}).map((e) => e.message)
        })
    }

    // Mongoose duplicate-key (e.g. unique email on a re-insert)
    if (err && err.code === 11000) {
        return res.status(409).json({
            message: "Duplicate value",
            field: Object.keys(err.keyValue || {})[0]
        })
    }

    // CORS rejection from app.js — surface as 403 instead of a bare 500.
    if (err && typeof err.message === "string" && err.message.startsWith("CORS:")) {
        return res.status(403).json({ message: err.message })
    }

    // JSON body parse error from express.json()
    if (err && err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON body" })
    }

    console.error("[error]", err)
    return res.status(500).json({
        message: "Internal server error",
        error: err && err.message ? err.message : "Unknown error"
    })
}

module.exports = {
    notFoundHandler,
    errorHandler,
    asyncHandler
}
