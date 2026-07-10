const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const mongoose = require("mongoose")
const { asyncHandler } = require("../middleware/error.middleware")

/**
 * POST /api/transactions
 * THE 10-STEP TRANSFER FLOW:
 *   1. Validate request
 *   2. Validate idempotency key
 *   3. Check account status
 *   4. Derive sender balance from ledger
 *   5. Create transaction (PENDING)
 *   6. Create DEBIT ledger entry
 *   7. Create CREDIT ledger entry
 *   8. Mark transaction COMPLETED
 *   9. Commit MongoDB session
 *  10. Send email notification
 */
const createTransaction = asyncHandler(async (req, res) => {

    /** 1. Validate request */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "fromAccount, toAccount, amount and idempotencyKey are required"
        })
    }

    if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({
            message: "amount must be a positive number"
        })
    }

    if (String(fromAccount) === String(toAccount)) {
        return res.status(400).json({
            message: "fromAccount and toAccount must be different"
        })
    }

    const [fromUserAccount, toUserAccount] = await Promise.all([
        accountModel.findOne({ _id: fromAccount }),
        accountModel.findOne({ _id: toAccount })
    ])

    if (!fromUserAccount || !toUserAccount) {
        // Same hint as in createInitialFundsTransaction: a missing account
        // is often caused by passing a user _id where an account _id is
        // expected. Surface that explicitly so the frontend can fix it.
        const userModel = require("../models/user.model")
        const offendingId = !fromUserAccount ? fromAccount : toAccount
        const matchingUser = await userModel.findOne({ _id: offendingId }).select("_id email")
        if (matchingUser) {
            return res.status(400).json({
                message: "fromAccount/toAccount must be account _ids, not user _ids",
                hint: `${offendingId} is the user ${matchingUser.email}. Fetch /api/accounts to get the right _id.`
            })
        }
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    // Ownership: the sender account must belong to the authenticated user.
    if (String(fromUserAccount.user) !== String(req.user._id)) {
        return res.status(403).json({
            message: "You can only transfer from your own accounts"
        })
    }

    /** 2. Validate idempotency key */
    const isTransactionAlreadyExists = await transactionModel.findOne({ idempotencyKey })
    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }
        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing"
            })
        }
        // FAILED / REVERSED — let the client retry with a fresh key.
        return res.status(409).json({
            message: `Previous transaction with this idempotencyKey is in state ${isTransactionAlreadyExists.status}, please retry with a new key`
        })
    }

    /** 3. Check account status */
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    /** 4. Derive sender balance from ledger */
    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
        })
    }

    const session = await mongoose.startSession()
    let transaction
    try {
        session.startTransaction()

        /** 5. Create transaction (PENDING) */
        const [created] = await transactionModel.create([ {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        } ], { session })
        transaction = created

        /** 6. Create DEBIT ledger entry */
        await ledgerModel.create([ {
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        } ], { session })

        /** 7. Create CREDIT ledger entry */
        await ledgerModel.create([ {
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        } ], { session })

        /** 8. Mark transaction COMPLETED */
        transaction.status = "COMPLETED"
        await transaction.save({ session })

        /** 9. Commit MongoDB session */
        await session.commitTransaction()
    } catch (error) {
        try {
            await session.abortTransaction()
        } catch (_) { /* session already terminal */ }
        // If we already wrote a transaction row, mark it FAILED so the next
        // request with the same idempotencyKey gets a clear 409 instead of
        // a duplicate-key error on insert.
        if (transaction && transaction._id) {
            try {
                await transactionModel.updateOne(
                    { _id: transaction._id },
                    { $set: { status: "FAILED" } }
                )
            } catch (_) { /* best-effort */ }
        }
        console.error("[transactions] createTransaction failed:", error)
        return res.status(500).json({
            message: "Transaction failed, please retry",
            error: error.message
        })
    } finally {
        session.endSession()
    }

    /** 10. Send email notification (fire-and-forget) */
    if (req.user && req.user.email) {
        emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)
            .catch((err) => {
                console.error("[transactions] Notification email failed:", err.message)
            })
    }

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction
    })
})


/**
 * POST /api/transactions/system/initial-funds
 * System-user only. Credits the caller's own ACTIVE source account's funds
 * to another account (typically a newly-created user account).
 */
const createInitialFundsTransaction = asyncHandler(async (req, res) => {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({
            message: "amount must be a positive number"
        })
    }

    const toUserAccount = await accountModel.findOne({ _id: toAccount })

    if (!toUserAccount) {
        // A common cause of this 400 is the caller passing a user _id
        // (e.g. the system user's _id) where an account _id is expected.
        // Detect that and surface a clearer error so it's fixable in
        // seconds instead of a guessing game.
        const userModel = require("../models/user.model")
        const matchingUser = await userModel.findOne({ _id: toAccount }).select("_id email")
        if (matchingUser) {
            return res.status(400).json({
                message: "toAccount must be an account _id, not a user _id",
                hint: `Got a user (${matchingUser.email}). The user has ${await accountModel.countDocuments({ user: matchingUser._id })} account(s); fetch /api/accounts to get the right _id.`
            })
        }
        return res.status(400).json({ message: "Invalid toAccount" })
    }

    if (toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "toAccount must be ACTIVE to receive initial funds"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id,
        status: "ACTIVE"
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user has no ACTIVE source account to fund from"
        })
    }

    if (String(fromUserAccount._id) === String(toAccount)) {
        return res.status(400).json({
            message: "fromAccount and toAccount must be different"
        })
    }

    // Idempotency: if a transaction with this key already exists, return its
    // current state instead of running the side effects again.
    const existing = await transactionModel.findOne({ idempotencyKey })
    if (existing) {
        if (existing.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: existing
            })
        }
        if (existing.status === "PENDING") {
            return res.status(200).json({ message: "Transaction is still processing" })
        }
        return res.status(409).json({
            message: `Previous transaction with this idempotencyKey is in state ${existing.status}, please retry with a new key`
        })
    }

    const session = await mongoose.startSession()
    try {
        session.startTransaction()

        // 1) Insert the transaction doc FIRST so we have a real _id to
        //    reference in the ledger rows.
        const [createdTransaction] = await transactionModel.create([ {
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        } ], { session })

        // 2) Write the two immutable ledger rows.
        await ledgerModel.create([ {
            account: fromUserAccount._id,
            amount: amount,
            transaction: createdTransaction._id,
            type: "DEBIT"
        } ], { session })

        await ledgerModel.create([ {
            account: toAccount,
            amount: amount,
            transaction: createdTransaction._id,
            type: "CREDIT"
        } ], { session })

        // 3) Mark the transaction COMPLETED, then commit.
        createdTransaction.status = "COMPLETED"
        await createdTransaction.save({ session })

        await session.commitTransaction()

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction: createdTransaction
        })
    } catch (error) {
        try {
            await session.abortTransaction()
        } catch (_) { /* session may already be in a terminal state */ }
        console.error("[transactions] createInitialFundsTransaction failed:", error)
        return res.status(500).json({
            message: "Initial funds transaction failed, please retry",
            error: error.message
        })
    } finally {
        session.endSession()
    }
})


/**
 * GET /api/transactions
 * Returns the authenticated user's transaction history — i.e. every
 * transaction where the user owns the fromAccount OR the toAccount.
 *
 * Query params (all optional):
 *   accountId — restrict to transactions touching a specific account
 *               (must be owned by the caller; 403 otherwise).
 *   status    — PENDING | COMPLETED | FAILED | REVERSED
 *   limit     — 1..100, default 50
 *   skip      — for pagination, default 0
 *
 * Each row is enriched with:
 *   direction — "DEBIT"  if caller's account is the sender
 *               "CREDIT" if caller's account is the receiver (and not the sender)
 *   counterpartyAccountId — the other side's account id
 *   counterpartyUserName  — the other side's account owner's name (best-effort)
 */
const getTransactionsController = asyncHandler(async (req, res) => {
    const { accountId, status, limit, skip } = req.query

    // Find the caller's accounts so we can scope the query to "transactions
    // touching MY accounts only" — without this, user A could see user B's
    // history just by guessing transaction ids.
    const myAccounts = await accountModel
        .find({ user: req.user._id })
        .select("_id user")
    const myAccountIds = myAccounts.map((a) => String(a._id))
    const myAccountIdSet = new Set(myAccountIds)

    if (myAccountIds.length === 0) {
        return res.status(200).json({ transactions: [], total: 0 })
    }

    // Optional accountId filter — must be one of the caller's accounts.
    if (accountId && !myAccountIdSet.has(String(accountId))) {
        return res.status(403).json({
            message: "You can only list transactions for your own accounts"
        })
    }

    const filter = {
        $or: [
            { fromAccount: { $in: myAccountIds } },
            { toAccount: { $in: myAccountIds } }
        ]
    }

    if (accountId) {
        // Re-scope the $or to that one account.
        filter.$or = [
            { fromAccount: accountId },
            { toAccount: accountId }
        ]
    }

    if (status) {
        const allowedStatuses = ["PENDING", "COMPLETED", "FAILED", "REVERSED"]
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: `status must be one of: ${allowedStatuses.join(", ")}`
            })
        }
        filter.status = status
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100)
    const parsedSkip = Math.max(parseInt(skip, 10) || 0, 0)

    const [transactions, total] = await Promise.all([
        transactionModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(parsedSkip)
            .limit(parsedLimit)
            .lean(),
        transactionModel.countDocuments(filter)
    ])

    // Enrich with counterparty + direction. Fetch the counterparty account
    // docs in one round-trip rather than N.
    const otherAccountIds = [
        ...new Set(
            transactions.map((t) =>
                String(myAccountIdSet.has(String(t.fromAccount)) ? t.toAccount : t.fromAccount)
            )
        )
    ]

    const counterpartyAccounts = otherAccountIds.length
        ? await accountModel.find({ _id: { $in: otherAccountIds } }).select("_id user").lean()
        : []

    const userModel = require("../models/user.model")
    const counterpartyUserIds = [
        ...new Set(counterpartyAccounts.map((a) => String(a.user)).filter(Boolean))
    ]
    const counterpartyUsers = counterpartyUserIds.length
        ? await userModel.find({ _id: { $in: counterpartyUserIds } }).select("_id name email").lean()
        : []
    const userById = new Map(counterpartyUsers.map((u) => [String(u._id), u]))
    const accountUserByAccountId = new Map(
        counterpartyAccounts.map((a) => [String(a._id), userById.get(String(a.user))])
    )

    const enriched = transactions.map((t) => {
        const isSender = myAccountIdSet.has(String(t.fromAccount))
        const isReceiver = myAccountIdSet.has(String(t.toAccount))
        const counterpartyAccountId = isSender ? t.toAccount : t.fromAccount
        const counterpartyUser = accountUserByAccountId.get(String(counterpartyAccountId))

        let direction
        if (isSender && isReceiver) {
            direction = "INTERNAL"
        } else if (isSender) {
            direction = "DEBIT"
        } else {
            direction = "CREDIT"
        }

        return {
            _id: t._id,
            amount: t.amount,
            status: t.status,
            fromAccount: t.fromAccount,
            toAccount: t.toAccount,
            direction,
            counterpartyAccountId,
            counterpartyUserName: counterpartyUser ? counterpartyUser.name : null,
            counterpartyUserEmail: counterpartyUser ? counterpartyUser.email : null,
            idempotencyKey: t.idempotencyKey,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt
        }
    })

    res.status(200).json({
        transactions: enriched,
        total,
        limit: parsedLimit,
        skip: parsedSkip
    })
})


module.exports = {
    createTransaction,
    createInitialFundsTransaction,
    getTransactionsController
}
