const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")



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
}))

app.use(express.json())
app.use(cookieParser())

/**
 * - Routes required
 */
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.routes")

/**
 * - Use Routes
 */

app.get("/", (req, res) => {
    res.send("Ledger Service is up and running")
})

app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)

module.exports = app