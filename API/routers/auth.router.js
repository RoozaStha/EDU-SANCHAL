const express = require('express');
const router = express.Router();
const {
  verifyEmail,
  validateVerificationToken,
  resendVerificationEmail
} = require('../controllers/emailVerification.controller');

router.get('/verify-email/:token', verifyEmail);
router.get('/validate-token/:token', validateVerificationToken);
router.post('/resend-verification', resendVerificationEmail);

module.exports = router;