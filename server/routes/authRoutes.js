import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { sendOTPEmail, generateOTP } from '../utils/emailService.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter for OTP requests
const otpLimiter = rateLimit({
  windowMs: 60 * 100, // 1 minute
  max: 1,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait 1 minute.',
  },
});

// Helper: Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Request OTP for registration
 * @access  Public
 */
router.post('/register', otpLimiter, async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ success: false, message: 'Email and name are required' });
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
          otp: { code: otp, expiresAt: otpExpiry },
          isEmailVerified: false,
        },
      },
      { upsert: true, new: true }
    );

    await sendOTPEmail(email, otp, name);

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and set password
 * @access  Public
 */
router.post('/verify-otp', async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({ success: false, message: 'Email, OTP, and password are required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || !user.otp || user.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.isEmailVerified = true;
    user.otp = undefined;

    await user.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Email verified and account created successfully', 
      email: user.email,
      password: req.body.password // Return the plain password for auto-fill
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user and set cookie
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || !user.isEmailVerified) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or email not verified' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const token = generateToken(user._id);

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .json({
        success: true,
        message: 'Login successful',
        token, // Add JWT token to response body
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Clear auth token cookie
 * @access  Public
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'Strict',
    secure: process.env.NODE_ENV === 'production',
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export default router;
