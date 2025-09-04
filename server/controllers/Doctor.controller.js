import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Doctor from '../models/doctor.js';
import { generateOTP, sendOTPEmail } from '../utils/emailService.js';

export const registerDoctor = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      specialization, 
      experience, 
      hospital, 
      phone, 
      location 
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !specialization || !experience || !hospital || !phone || !location) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone must be 10 digits' 
      });
    }

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(409).json({ 
        success: false, 
        message: 'Doctor already registered with this email' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const doctor = new Doctor({
      name,
      email,
      password: hashedPassword,
      specialization,
      experience,
      hospital,
      phone,
      location,
      role: 'doctor',
      isEmailVerified: false,
      otp: {
        code: otp,
        expiresAt: otpExpiry
      }
    });

    await doctor.save();

    try {
      await sendOTPEmail(email, otp, name);
    } catch (emailError) {
      await Doctor.findByIdAndDelete(doctor._id);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send OTP email' 
      });
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Doctor registered successfully, OTP sent to email',
      email: email
    });
  } catch (error) {
    console.error('Doctor register error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
};

export const verifyDoctorOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP must be 6 digits' 
      });
    }

    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }

    if (doctor.isEmailVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor already verified' 
      });
    }

    if (!doctor.otp || !doctor.otp.code) {
      return res.status(400).json({ 
        success: false, 
        message: 'No OTP found. Please register again.' 
      });
    }

    if (doctor.otp.code !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    if (doctor.otp.expiresAt < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired' 
      });
    }

    doctor.isEmailVerified = true;
    doctor.otp = undefined;
    await doctor.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Doctor verified successfully',
      email: email
    });
  } catch (error) {
    console.error('Doctor verify OTP error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'OTP verification failed' 
    });
  }
};

export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    if (!doctor.isEmailVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify OTP first' 
      });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { 
        userId: doctor._id,   // ✅ consistency fix
        role: 'doctor' 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return res.status(200).json({ 
      success: true, 
      token, 
      role: 'doctor',
      user: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: 'doctor'
      }
    });
  } catch (error) {
    console.error('Doctor login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
};

export const getAllVerifiedDoctors = async (_req, res) => {
  try {
    const doctors = await Doctor.find({ isEmailVerified: true }).select('-password -otp');
    return res.status(200).json({ success: true, doctors });
  } catch (error) {
    console.error('Doctor list error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch doctors' 
    });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findById(id).select('-password -otp');
    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }
    return res.status(200).json({ success: true, doctor });
  } catch (error) {
    console.error('Get doctor error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch doctor' 
    });
  }
};

export const updateDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    
    // Prevent updating sensitive fields
    delete update.password;
    delete update.email;
    delete update.isEmailVerified;
    delete update.otp;
    delete update.role;
    
    const doctor = await Doctor.findByIdAndUpdate(id, update, { new: true }).select('-password -otp');
    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }
    return res.status(200).json({ success: true, doctor });
  } catch (error) {
    console.error('Update doctor error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update doctor' 
    });
  }
};

// Create demo doctors for testing
export const createDemoDoctors = async (req, res) => {
  try {
    const demoDoctors = [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Dr. Kuljeet',
        specialization: 'Cardiology',
        location: 'Anand, Gujarat',
        hospital: 'Krishna Hospital',
        phone: '9313232981',
        email: 'krishna@hospital.com',
        experience: '5 years',
        password: await bcrypt.hash('demo123', 12),
        role: 'doctor',
        isEmailVerified: true
      },
      {
        _id: '507f1f77bcf86cd799439012',
        name: 'Dr. Poojan Shah',
        specialization: 'Dermatology',
        location: 'Nadiad, Gujarat',
        hospital: 'Arshvi Medical Center',
        phone: '9090998908',
        email: 'shah@hospital.com',
        experience: '10 years',
        password: await bcrypt.hash('demo123', 12),
        role: 'doctor',
        isEmailVerified: true
      },
      {
        _id: '507f1f77bcf86cd799439013',
        name: 'Dr. Vishwa Patel',
        specialization: 'Pediatrics',
        location: 'Anand, Gujarat',
        hospital: 'Leeds Children\'s Hospital',
        phone: '8909678900',
        email: 'vishva@hospital.com',
        experience: '10 years',
        password: await bcrypt.hash('demo123', 12),
        role: 'doctor',
        isEmailVerified: true
      },
      {
        _id: '507f1f77bcf86cd799439014',
        name: 'Dr. Vimal Kumar',
        specialization: 'Orthopedics',
        location: 'Nadiad, Gujarat',
        hospital: 'DDIT Hospital',
        phone: '9087690870',
        email: 'vimal.kumar@hospital.com',
        experience: '20 years',
        password: await bcrypt.hash('demo123', 12),
        role: 'doctor',
        isEmailVerified: true
      }
    ];

    // Clear existing demo doctors
    await Doctor.deleteMany({
      _id: { $in: demoDoctors.map(d => d._id) }
    });

    // Insert demo doctors
    const insertedDoctors = await Doctor.insertMany(demoDoctors);

    return res.status(201).json({
      success: true,
      message: 'Demo doctors created successfully',
      doctors: insertedDoctors.map(d => ({
        _id: d._id,
        name: d.name,
        specialization: d.specialization,
        location: d.location,
        hospital: d.hospital,
        phone: d.phone,
        email: d.email,
        experience: d.experience
      }))
    });
  } catch (error) {
    console.error('Create demo doctors error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create demo doctors'
    });
  }
};


