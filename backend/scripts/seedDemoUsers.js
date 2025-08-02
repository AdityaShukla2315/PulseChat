
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';;
import User from '../src/models/user.model.js';

const demoUsers = [
  {
    fullName: 'Alice Demo',
    email: 'alice@example.com',
    password: 'password123',
    profilePic: 'https://randomuser.me/api/portraits/women/1.jpg',
  },
  {
    fullName: 'Bob Demo',
    email: 'bob@example.com',
    password: 'password123',
    profilePic: 'https://randomuser.me/api/portraits/men/2.jpg',
  },     
  {
    fullName: 'Charlie Demo',
    email: 'charlie@example.com',
    password: 'password123',
    profilePic: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
  {
    fullName: 'Support Bot',
    email: 'support@chatapp.local',
    password: 'supportbot',
    profilePic: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
    isBot: true,
  },
];  

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    for (const user of demoUsers) {
      const exists = await User.findOne({ email: user.email });
      if (!exists) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await User.create({ ...user, password: hashedPassword });
        console.log(`Created user: ${user.fullName}`);
      } else {
        console.log(`User already exists: ${user.fullName}`);
      }
    }
    mongoose.disconnect();
    console.log('Seeding complete.');
  } catch (err) {
    console.error('Error seeding users:', err);
    process.exit(1);
  }
}

seed().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
