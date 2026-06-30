import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';

dotenv.config({ path: '../.env' });

async function seedAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    const email = 'admin@soulcare.com';
    let admin = await User.findOne({ email });

    if (admin) {
      admin.role = 'admin';
      await admin.save();
      console.log(`Updated existing user ${email} to admin role.`);
    } else {
      admin = await User.create({
        name: 'Platform Admin',
        email: email,
        password: 'password123', // the pre-save hook will hash this
        role: 'admin',
        anonymous_id: 'Admin-001'
      });
      console.log(`Successfully seeded admin user: ${email} / password123`);
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdmin();
