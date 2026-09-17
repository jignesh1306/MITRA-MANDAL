import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User.js';
import { Group } from './models/Group.js';
import { GroupMember } from './models/GroupMember.js';

const membersData = [
  { name: 'Aarav Patel', phone: '9876543210', email: 'aarav.patel@example.com' },
  { name: 'Rohan Sharma', phone: '9876543211', email: 'rohan.sharma@example.com' },
  { name: 'Priya Shah', phone: '9876543212', email: 'priya.shah@example.com' },
  { name: 'Ananya Joshi', phone: '9876543213', email: 'ananya.joshi@example.com' },
  { name: 'Vikram Mehta', phone: '9876543214', email: 'vikram.mehta@example.com' },
  { name: 'Sneha Trivedi', phone: '9876543215', email: 'sneha.trivedi@example.com' },
  { name: 'Kabir Desai', phone: '9876543216', email: 'kabir.desai@example.com' },
  { name: 'Diya Pandya', phone: '9876543217', email: 'diya.pandya@example.com' },
  { name: 'Aditya Bhatt', phone: '9876543218', email: 'aditya.bhatt@example.com' },
  { name: 'Pooja Dave', phone: '9876543219', email: 'pooja.dave@example.com' },
  { name: 'Harsh Vyas', phone: '9876543220', email: 'harsh.vyas@example.com' },
  { name: 'Neha Vora', phone: '9876543221', email: 'neha.vora@example.com' },
  { name: 'Yash Solanki', phone: '9876543222', email: 'yash.solanki@example.com' },
  { name: 'Kavya Parmar', phone: '9876543223', email: 'kavya.parmar@example.com' }
];

async function seedPendingMembers() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mitra-mandal');
    console.log('Connected to MongoDB');

    let group = await Group.findOne();
    if (!group) {
      group = await Group.create({
        name: 'Mitra-Mandal (મિત્ર-મંડળ)',
        monthlyContribution: 200000
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);

    let createdCount = 0;
    for (const data of membersData) {
      const existing = await User.findOne({ phone: data.phone, role: 'MEMBER' });
      if (existing) {
        console.log(`User with phone ${data.phone} already exists, skipping.`);
        continue;
      }

      const user = await User.create({
        name: data.name,
        phone: data.phone,
        email: data.email,
        passwordHash,
        role: 'MEMBER',
        status: 'PENDING'
      });

      await GroupMember.create({
        groupId: group._id,
        userId: user._id,
        status: 'PENDING'
      });

      createdCount++;
      console.log(`Created PENDING member: ${data.name} (${data.phone})`);
    }

    console.log(`Successfully created ${createdCount} PENDING member requests!`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding pending members:', err);
    process.exit(1);
  }
}

seedPendingMembers();
