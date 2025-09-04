import express from 'express';
import rateLimit from 'express-rate-limit';
import { registerDoctor, verifyDoctorOTP, loginDoctor, getAllVerifiedDoctors, getDoctorById, updateDoctorById, createDemoDoctors } from '../controllers/Doctor.controller.js';

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  message: { success: false, message: 'Too many OTP requests. Please wait 1 minute.' }
});

router.post('/register', otpLimiter, registerDoctor);
router.post('/verify-otp', verifyDoctorOTP);
router.post('/login', loginDoctor);
router.post('/create-demo', createDemoDoctors);
router.get('/all', getAllVerifiedDoctors);
router.get('/:id', getDoctorById);
router.put('/:id', updateDoctorById);

export default router;


