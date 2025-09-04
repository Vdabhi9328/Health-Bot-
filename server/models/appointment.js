import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  // Patient Information
  patientName: {
    type: String,
    required: true
  },
  patientEmail: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String,
    required: true
  },
  patientAge: {
    type: Number,
    required: true
  },
  patientGender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  
  // Doctor Information
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  doctorEmail: {
    type: String,
    required: true
  },
  doctorSpecialization: {
    type: String,
    required: true
  },
  doctorHospital: {
    type: String,
    required: true
  },
  
  // Appointment Details
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  symptoms: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'confirmed', 'cancelled', 'completed', 'rescheduled'],
    default: 'pending'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Additional Information
  isUrgent: {
    type: Boolean,
    default: false
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  prescription: {
    type: String,
    default: ''
  },
  diagnosis: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for better query performance
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientEmail: 1 });
appointmentSchema.index({ status: 1 });

// Pre-save middleware to update updatedAt
appointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Appointment', appointmentSchema);
