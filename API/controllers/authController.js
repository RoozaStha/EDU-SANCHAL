const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Student = require('../models/student.model');
const Teacher = require('../models/teacher.model');
const School = require('../models/school.model');
const sendEmail = require('../utilities/emailService');
const { resetPasswordTemplate } = require('../utilities/emailTemplates');

exports.forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;
    
    let Model;
    switch (role) {
      case 'student':
        Model = Student;
        break;
      case 'teacher':
        Model = Teacher;
        break;
      case 'school':
        Model = School;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await Model.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account with that email exists'
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Use FRONTEND_URL from environment variables
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}?role=${role}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: resetPasswordTemplate(resetUrl, user.name || user.email)
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};

exports.validateResetToken = async (req, res) => {
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
    switch (role) {
      case 'student':
        Model = Student;
        break;
      case 'teacher':
        Model = Teacher;
        break;
      case 'school':
        Model = School;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await Model.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token validation'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, role } = req.body;

    let Model;
    switch (role) {
      case 'student':
        Model = Student;
        break;
      case 'teacher':
        Model = Teacher;
        break;
      case 'school':
        Model = School;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await Model.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }

    // Hash the new password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been successfully reset'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};