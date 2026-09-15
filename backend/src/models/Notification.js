import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  type: { 
    type: String, 
    enum: [
      'CONTRIBUTION_REMINDER', 
      'LOAN_APPROVED', 
      'LOAN_REJECTED', 
      'EMI_DUE', 
      'EMI_OVERDUE', 
      'EMI_PAID', 
      'LOAN_COMPLETED', 
      'GENERAL_ADMIN'
    ], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const Notification = mongoose.model('Notification', notificationSchema);
