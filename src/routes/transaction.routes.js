const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const transactionController = require("../controllers/transaction.controller")

const transactionRoutes = Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction
 */
transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

/**
 * - GET /api/transactions/
 * - List the caller's transaction history. Optional query params:
 *   ?accountId=...  (must be one of the caller's accounts)
 *   ?status=PENDING|COMPLETED|FAILED|REVERSED
 *   ?limit=1..100, default 50
 *   ?skip=0, default 0
 *   Returns enriched rows with `direction` and counterparty info.
 */
transactionRoutes.get("/", authMiddleware.authMiddleware, transactionController.getTransactionsController)


/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes;