import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Validate email configuration
const validateEmailConfig = () => {
  const required = ['EMAIL_USER', 'EMAIL_PASS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing email configuration: ${missing.join(', ')}`);
  }
};

// Setup transporter
const createTransporter = () => {
  validateEmailConfig();
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// ✅ Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ Send OTP Email
export const sendOTPEmail = async (email, otp, userName) => {
  try {
    const transporter = createTransporter();
    const fromName = process.env.EMAIL_FROM || `"HelthBot" <${process.env.EMAIL_USER}>`;

    const mailOptions = {
      from: fromName,
      to: email,
      subject: 'Email Verification - HelthBot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">HelthBot</h1>
            <p style="margin-top: 10px; opacity: 0.9;">Email Verification</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333;">Hello ${userName},</h2>
            <p style="color: #555;">Use the OTP below to verify your email address:</p>
            <div style="margin: 20px auto; padding: 15px; background: #fff; border: 2px solid #667eea; border-radius: 8px; text-align: center; width: fit-content;">
              <h3 style="color: #667eea; font-size: 32px; margin: 0;">${otp}</h3>
            </div>
            <p style="color: #666;">This OTP is valid for 10 minutes.</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">If you didn't request this verification, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent to', email, '| Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check your email credentials.');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Failed to connect to email server. Please check your email configuration.');
    } else {
      throw new Error('Failed to send OTP email. Please try again later.');
    }
  }
};

// ✅ Verify transporter connection
export const verifyEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email transporter is ready');
    return true;
  } catch (error) {
    console.error('❌ Email transporter connection failed:', error.message);
    return false;
  }
};

// ✅ Test email configuration
export const testEmailConfig = async () => {
  try {
    const isConnected = await verifyEmailConnection();
    if (!isConnected) {
      throw new Error('Email connection test failed');
    }
    
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration test failed:', error.message);
    return false;
  }
};
