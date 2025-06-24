const resetPasswordTemplate = (resetUrl, name) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>You recently requested to reset your password. Click the button below to proceed:</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" 
           style="background-color: #3498db; color: white; 
                  padding: 12px 24px; text-decoration: none; 
                  border-radius: 4px; font-weight: bold;">
          Reset Password
        </a>
      </div>
      
      <p>If you didn't request this, please ignore this email.</p>
      <p>This password reset link will expire in 1 hour.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p>Best regards,</p>
        <p>The School Management Team</p>
      </div>
    </div>
  `;
};

const verificationEmailTemplate = (verificationUrl, name) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Email Verification</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering. Please click the button below to verify your email address:</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #3498db; color: white; 
                  padding: 12px 24px; text-decoration: none; 
                  border-radius: 4px; font-weight: bold;">
          Verify Email
        </a>
      </div>
      
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't create an account, please ignore this email.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p>Best regards,</p>
        <p>The School Management Team</p>
      </div>
    </div>
  `;
};

// Export both templates
module.exports = { 
  resetPasswordTemplate,
  verificationEmailTemplate
};