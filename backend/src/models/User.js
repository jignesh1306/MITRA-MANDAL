import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: false, lowercase: true, trim: true, default: '' },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'MEMBER'], default: 'MEMBER' },
  profilePhoto: { type: String, default: '' },
  joiningDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['ACTIVE', 'PENDING', 'DISABLED'], default: 'ACTIVE' }
}, {
  timestamps: true
});

// Allow the same phone number to have both an Admin account and a Member account
userSchema.index({ phone: 1, role: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1 });

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
