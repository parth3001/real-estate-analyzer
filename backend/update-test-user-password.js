/**
 * Script to update test user password for E2E testing
 * Senior Test Engineer Solution
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define User schema inline to avoid import issues
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  role: { type: String, default: 'user' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-analyzer';

async function updateTestUserPassword() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if test user exists
    const testEmail = 'test@example.com';
    let user = await User.findOne({ email: testEmail });
    
    if (user) {
      console.log(`📧 Found existing user: ${testEmail}`);
      
      // Update password
      const newPassword = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      user.password = hashedPassword;
      await user.save();
      
      console.log('✅ Password updated successfully!');
      console.log(`📋 Credentials for E2E testing:`);
      console.log(`   Email: ${testEmail}`);
      console.log(`   Password: ${newPassword}`);
      
    } else {
      console.log(`❌ User not found. Creating new test user...`);
      
      // Create new user
      const newPassword = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      user = new User({
        email: testEmail,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      });
      
      await user.save();
      
      console.log('✅ Test user created successfully!');
      console.log(`📋 Credentials for E2E testing:`);
      console.log(`   Email: ${testEmail}`);
      console.log(`   Password: ${newPassword}`);
    }
    
    // Test the login to verify
    console.log('\n🧪 Testing login...');
    const isValid = await bcrypt.compare('TestPassword123!', user.password);
    if (isValid) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the update
updateTestUserPassword();