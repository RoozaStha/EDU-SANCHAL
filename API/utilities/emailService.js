require('dotenv').config();
const nodemailer = require('nodemailer');

// Validate credentials on startup
if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
  throw new Error('Email credentials are missing in environment variables');
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: true, // Use SSL for port 465
  auth: {
    user: process.env.EMAIL_USERNAME,  // Changed to EMAIL_USERNAME
    pass: process.env.EMAIL_PASSWORD   // Changed to EMAIL_PASSWORD
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,
  socketTimeout: 30000,
  greetingTimeout: 5000,
  debug: true
});

// Test connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
    console.log('Using account:', process.env.EMAIL_USERNAME);
  }
});

const sendEmail = async (options) => {
  try {
    if (!options.to || !options.subject || !options.html) {
      throw new Error('Incomplete email options');
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_SENDER_NAME}" <${process.env.EMAIL_USERNAME}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    console.log('Sending email to:', options.to);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    
    let errorMessage = 'Email could not be sent';
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed - check your email credentials';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection to email server failed';
    }
    
    throw new Error(`${errorMessage}: ${error.message}`);
  }
};

module.exports = sendEmail;