import mongoose from 'mongoose';

const groupMemberSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['ACTIVE', 'PENDING', 'DISABLED'], default: 'ACTIVE' }
}, {
  timestamps: true
});

groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

export const GroupMember = mongoose.model('GroupMember', groupMemberSchema);
