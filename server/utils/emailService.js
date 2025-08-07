import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Setup transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ Send OTP Email
export const sendOTPEmail = async (email, otp, userName) => {
  try {
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
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent to', email, '| Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

// ✅ Verify transporter connection
export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email transporter is ready');
    return true;
  } catch (error) {
    console.error('❌ Email transporter connection failed:', error.message);
    return false;
  }
};
