const nodemailer = require('nodemailer');

// Gmail SMTP with OAuth2. Using explicit host/port instead of the `service: 'gmail'`
// shorthand is more reliable across nodemailer versions.
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: undefined, // nodemailer will fetch this from the refresh token
    },
});

// Detect placeholder credentials so the app doesn't try to authenticate and
// stall startup. The actual emails simply log a warning instead of sending.
const REFRESH_TOKEN_PLACEHOLDER = !process.env.REFRESH_TOKEN
    || process.env.REFRESH_TOKEN === 'your_google_refresh_token'
    || process.env.REFRESH_TOKEN.startsWith('your_');

function emailConfigured() {
    return !REFRESH_TOKEN_PLACEHOLDER
        && !!process.env.EMAIL_USER
        && !!process.env.CLIENT_ID
        && !!process.env.CLIENT_SECRET;
}

// Verify connection at startup — but only if real credentials are present.
transporter.verify((error, success) => {
    if (!emailConfigured()) {
        console.warn('[email] Skipping SMTP verify: REFRESH_TOKEN is a placeholder. Set a real Gmail OAuth refresh token in .env to enable outbound email.');
        return;
    }
    if (error) {
        console.error('[email] SMTP verify failed:', error.message);
    } else {
        console.log('[email] SMTP server is ready');
    }
});


/**
 * Low-level send. Throws on failure so callers can react.
 * If credentials are missing/placeholder, logs and resolves (no-op) — useful
 * for local dev when you don't care about real email delivery.
 */
const sendEmail = async (to, subject, text, html) => {
    if (!emailConfigured()) {
        console.warn(`[email] Skipping send to ${to} (${subject}): SMTP not configured.`);
        return { skipped: true };
    }

    try {
        const info = await transporter.sendMail({
            from: `"Backend Ledger" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log('[email] Sent:', info.messageId, '->', to);
        return info;
    } catch (error) {
        console.error('[email] Send failed:', error.message);
        throw error;
    }
};


async function sendRegistrationEmail(userEmail, name) {
    const subject = 'Welcome to Backend Ledger!';
    const text = `Hello ${name},\n\nThank you for registering at Backend Ledger. We're excited to have you on board!\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>Thank you for registering at Backend Ledger. We're excited to have you on board!</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    return sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Successful!';
    const text = `Hello ${name},\n\nYour transaction of $${amount} to account ${toAccount} was successful.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>Your transaction of $${amount} to account ${toAccount} was successful.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    return sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Failed';
    const text = `Hello ${name},\n\nWe regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>We regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    return sendEmail(userEmail, subject, text, html);
}

async function sendPasswordResetEmail(userEmail, name, resetLink) {
    const subject = 'Reset your Backend Ledger password';
    const text = `Hello ${name},\n\nWe received a request to reset your password. Click the link below to set a new password. This link is valid for 1 hour.\n\n${resetLink}\n\nIf you did not request a password reset, please ignore this email.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>We received a request to reset your password. Click the link below to set a new password. This link is valid for 1 hour.</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request a password reset, please ignore this email.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    return sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail,
    sendPasswordResetEmail,
    // Exported for tests / debugging.
    _internal: { emailConfigured, transporter },
};