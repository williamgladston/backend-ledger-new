const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service")
const tokenBlackListModel = require("../models/blackList.model")
const bcrypt = require("bcryptjs")
const crypto = require("crypto")

/**
* - user register controller
* - POST /api/auth/register
*/
async function userRegisterController(req, res) {
    const { email, password, name } = req.body

    const isExists = await userModel.findOne({
        email: email
    })

    if (isExists) {
        return res.status(422).json({
            message: "User already exists with email.",
            status: "failed"
        })
    }

    const user = await userModel.create({
        email, password, name
    })

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" })

    res.cookie("token", token)

    res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })

    // Fire-and-forget: don't let SMTP delay/failure break the registration flow.
    emailService.sendRegistrationEmail(user.email, user.name).catch((err) => {
        console.error("[auth] Registration email failed:", err.message)
    })
}

/**
 * - User Login Controller
 * - POST /api/auth/login
  */

async function userLoginController(req, res) {
    const { email, password } = req.body

    const user = await userModel.findOne({ email }).select("+password")

    if (!user) {
        return res.status(401).json({
            message: "Email or password is INVALID"
        })
    }

    const isValidPassword = await user.comparePassword(password)

    if (!isValidPassword) {
        return res.status(401).json({
            message: "Email or password is INVALID"
        })
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" })

    res.cookie("token", token)

    res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })

}


/**
 * - User Logout Controller
 * - POST /api/auth/logout
  */
async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        return res.status(200).json({
            message: "User logged out successfully"
        })
    }



    await tokenBlackListModel.create({
        token: token
    })

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })

}


/**
 * - Forgot Password Controller
 * - POST /api/auth/forgot-password
 * - Always responds 200 to avoid leaking which emails exist. If the user
 *   exists, generates a reset token (raw sent by email, hashed stored on
 *   the user record) with a 1-hour expiry and emails the reset link.
 */
async function forgotPasswordController(req, res) {
    const { email } = req.body

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        })
    }

    const user = await userModel.findOne({ email })

    if (user) {
        const rawToken = crypto.randomBytes(32).toString("hex")
        const hashedToken = await bcrypt.hash(rawToken, 10)

        user.resetPasswordToken = hashedToken
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000)
        await user.save()

        const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`

        await emailService.sendPasswordResetEmail(user.email, user.name, resetLink)
    }

    res.status(200).json({
        message: "If an account with that email exists, a password reset link has been sent."
    })
}


/**
 * - Reset Password Controller
 * - POST /api/auth/reset-password
 * - Accepts { token, email, newPassword }. Validates the reset token against
 *   the stored hash and expiry, then updates the password (the pre-save hook
 *   in user.model.js re-hashes it).
 */
async function resetPasswordController(req, res) {
    const { token, email, newPassword } = req.body

    if (!token || !email || !newPassword) {
        return res.status(400).json({
            message: "token, email and newPassword are required"
        })
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters"
        })
    }

    const user = await userModel.findOne({ email }).select("+resetPasswordToken +resetPasswordExpires")

    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
        return res.status(400).json({
            message: "Invalid or expired reset token"
        })
    }

    if (user.resetPasswordExpires < new Date()) {
        return res.status(400).json({
            message: "Reset token has expired, please request a new one"
        })
    }

    const isValidToken = await bcrypt.compare(token, user.resetPasswordToken)

    if (!isValidToken) {
        return res.status(400).json({
            message: "Invalid or expired reset token"
        })
    }

    user.password = newPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.status(200).json({
        message: "Password has been reset successfully. You can now log in with your new password."
    })
}


module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController,
    forgotPasswordController,
    resetPasswordController
}