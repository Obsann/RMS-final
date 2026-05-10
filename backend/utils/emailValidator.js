const { validate } = require('deep-email-validator');

/**
 * Verify an email address using deep-email-validator.
 * Checks: regex, typo, disposable domain, MX records.
 * SMTP check is disabled (many providers block it, causing false negatives).
 *
 * Returns { valid: boolean, reason?: string, message: string }
 */
async function verifyEmail(email) {
  try {
    const result = await validate({
      email,
      validateRegex: true,
      validateMx: true, // Strictly check if domain exists and can receive emails
      validateTypo: true,
      validateDisposable: true,
      validateSMTP: false, // Disabled — too many false negatives from firewall/cloud hosts
    });

    if (result.valid) {
      return { valid: true, message: 'Email accepted.' };
    }

    // Build a human-friendly message based on the failure reason
    const reason = result.reason || 'unknown';
    const messages = {
      regex: 'The email address format is invalid.',
      typo: 'Invalid email address.',
      disposable: 'Disposable/temporary email addresses are not allowed. Please use a real email.',
      mx: 'The email domain does not exist or cannot receive emails.',
      smtp: 'The email mailbox could not be verified.',
    };

    return {
      valid: false,
      reason,
      message: messages[reason] || 'The provided email address could not be verified.',
    };
  } catch (error) {
    // If the validator itself errors, fail open — don't block registration
    console.error('[EmailValidator] Verification error:', error.message || error);
    return { valid: true, message: 'Verification service unavailable — allowing email.' };
  }
}

module.exports = { verifyEmail };
