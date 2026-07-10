/**
 * Tiny request logger. Logs method, path, status, and duration. Mounted
 * before the routes in src/app.js so every request is visible in the
 * server log — including any 4xx/5xx, with the body's keys redacted.
 *
 * This is the kind of breadcrumb that turns a "I got a 500" bug report
 * into a "ah, the body was { toAccount: undefined, idempotencyKey: null }"
 * one-liner.
 */
module.exports = function requestLogger(req, res, next) {
    const start = Date.now()
    res.on("finish", () => {
        const duration = Date.now() - start
        // Don't log bodies (they contain passwords and tokens) — just the keys.
        const bodyKeys = req.body && typeof req.body === "object" ? Object.keys(req.body).join(",") : ""
        console.log(
            `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)${bodyKeys ? ` body={${bodyKeys}}` : ""}`
        )
    })
    next()
}
