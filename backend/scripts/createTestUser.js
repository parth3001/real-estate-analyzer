// Script to create a test user with dual-mode preferences
// Run: node scripts/createTestUser.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// User model
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  dualModePreferences: {
    currentMode: {
      type: String,
      enum: ['novice', 'pro'],
      default: 'novice'
    },
    personaMapping: {
      novice: {
        type: String,
        enum: ['learning', 'experienced', 'data_analyst', 'speed_scanner'],
        default: 'learning'
      },
      pro: {
        type: String,
        enum: ['learning', 'experienced', 'data_analyst', 'speed_scanner'],
        default: 'experienced'
      }
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    modeHistory: [{
      mode: {
        type: String,
        enum: ['novice', 'pro'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    preferences: {
      showEducationalTooltips: {
        type: Boolean,
        default: true
      },
      defaultAnalysisComplexity: {
        type: String,
        enum: ['basic', 'detailed', 'comprehensive'],
        default: 'basic'
      },
      autoSwitchToProAfterAnalyses: {
        type: Number,
        min: 1,
        max: 100
      }
    }
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', UserSchema);

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-analyzer');
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'dualmode.test@example.com' });
    if (existingUser) {
      console.log('Test user already exists. Updating with dual-mode preferences...');
      
      // Update existing user with dual-mode preferences
      existingUser.dualModePreferences = {
        currentMode: 'novice',
        personaMapping: {
          novice: 'learning',
          pro: 'experienced'
        },
        onboardingCompleted: true,
        modeHistory: [
          {
            mode: 'novice',
            timestamp: new Date()
          }
        ],
        preferences: {
          showEducationalTooltips: true,
          defaultAnalysisComplexity: 'basic',
          autoSwitchToProAfterAnalyses: 10
        }
      };
      
      await existingUser.save();
      console.log('Test user updated successfully!');
    } else {
      // Create new test user
      const hashedPassword = await bcrypt.hash('TestUser123!', 12);
      
      const testUser = new User({
        email: 'dualmode.test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isVerified: true,
        dualModePreferences: {
          currentMode: 'novice',
          personaMapping: {
            novice: 'learning',
            pro: 'experienced'
          },
          onboardingCompleted: true,
          modeHistory: [
            {
              mode: 'novice',
              timestamp: new Date()
            }
          ],
          preferences: {
            showEducationalTooltips: true,
            defaultAnalysisComplexity: 'basic',
            autoSwitchToProAfterAnalyses: 10
          }
        }
      });

      await testUser.save();
      console.log('Test user created successfully!');
    }

    console.log('\n=== Test User Credentials ===');
    console.log('Email: dualmode.test@example.com');
    console.log('Password: TestUser123!');
    console.log('Current Mode: novice');
    console.log('Novice Persona: learning');
    console.log('Pro Persona: experienced');
    console.log('============================\n');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createTestUser();