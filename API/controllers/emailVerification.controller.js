const crypto = require('crypto');
const Student = require('../models/student.model');
const Teacher = require('../models/teacher.model');
const School = require('../models/school.model');
const sendEmail = require('../utilities/emailService');
const { verificationEmailTemplate } = require('../utilities/emailTemplates');

exports.generateVerificationToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

exports.sendVerificationEmail = async (user, role) => {
  try {
    const token = this.generateVerificationToken();
    const expires = Date.now() + 3600000; // 1 hour
    
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(expires);
    await user.save();
    
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&role=${role}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      html: verificationEmailTemplate(verificationUrl, user.name || user.school_name)
    });
    
    return true;
  } catch (error) {
    console.error('Error in sendVerificationEmail:', error);
    throw error;
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const { role } = req.query;

    if (!token || !role) {
      return res.status(400).json({
        success: false,
        message: 'Token and role are required'
      });
    }

    let Model;
    switch (role.toLowerCase()) {
      case 'student': Model = Student; break;
      case 'teacher': Model = Teacher; break;
      case 'school': Model = School; break;
      default: return res.status(400).json({ 
        success: false, 
        message: 'Invalid role' 
      });
    }

    // Find user by token
    const user = await Model.findOne({
      emailVerificationToken: token
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Email verification token is invalid'
      });
    }

    // Check if token has expired
    if (user.emailVerificationExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Email verification token has expired'
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified',
        redirect: '/login'
      });
    }

    // Update verification status
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      redirect: '/login'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
};

exports.validateVerificationToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { role } = req.query;

    if (!token || !role) {
      return res.status(400).json({
        valid: false,
        message: 'Token and role are required'
      });
    }

    let Model;
    switch (role.toLowerCase()) {
      case 'student': Model = Student; break;
      case 'teacher': Model = Teacher; break;
      case 'school': Model = School; break;
      default: return res.status(400).json({
        valid: false,
        message: 'Invalid role'
      });
    }

    const user = await Model.findOne({
      emailVerificationToken: token
    });

    if (!user) {
      return res.status(200).json({
        valid: false,
        message: 'Token is invalid'
      });
    }

    if (user.emailVerificationExpires < new Date()) {
      return res.status(200).json({
        valid: false,
        message: 'Token has expired'
      });
    }

    res.status(200).json({
      valid: true,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      valid: false,
      message: 'Server error during token validation'
    });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email and role are required'
      });
    }

    let Model;
    switch (role.toLowerCase()) {
      case 'student': Model = Student; break;
      case 'teacher': Model = Teacher; break;
      case 'school': Model = School; break;
      default: return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Regenerate token
    const token = this.generateVerificationToken();
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + 3600000);
    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&role=${role}`;

    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      html: verificationEmailTemplate(verificationUrl, user.name || user.school_name)
    });

    res.status(200).json({
      success: true,
      message: 'Verification email resent successfully'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    });
  }
};