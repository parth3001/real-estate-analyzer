import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Dual-mode related types
export type UserMode = 'novice' | 'pro';
export type PersonaType = 'learning' | 'experienced' | 'data_analyst' | 'speed_scanner';

export interface DualModePreferences {
  currentMode: UserMode;
  personaMapping: {
    novice: PersonaType;
    pro: PersonaType;
  };
  onboardingCompleted: boolean;
  modeHistory: Array<{
    mode: UserMode;
    timestamp: Date;
  }>;
  preferences: {
    showEducationalTooltips: boolean;
    defaultAnalysisComplexity: 'basic' | 'detailed' | 'comprehensive';
    autoSwitchToProAfterAnalyses?: number;
  };
}

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  
  // Dual-mode preferences (optional for backward compatibility)
  dualModePreferences?: DualModePreferences;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
  getCurrentMode(): UserMode;
  setMode(mode: UserMode): void;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
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

// Index for faster queries
UserSchema.index({ email: 1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to check password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to get full name
UserSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

// Instance method to get current dual-mode
UserSchema.methods.getCurrentMode = function(): UserMode {
  return this.dualModePreferences?.currentMode || 'novice';
};

// Instance method to set dual-mode
UserSchema.methods.setMode = function(mode: UserMode): void {
  if (!this.dualModePreferences) {
    this.dualModePreferences = {
      currentMode: mode,
      personaMapping: {
        novice: 'learning',
        pro: 'experienced'
      },
      onboardingCompleted: false,
      modeHistory: [],
      preferences: {
        showEducationalTooltips: true,
        defaultAnalysisComplexity: 'basic'
      }
    };
  } else {
    this.dualModePreferences.currentMode = mode;
  }
  
  // Add to mode history
  this.dualModePreferences.modeHistory.push({
    mode,
    timestamp: new Date()
  });
  
  // Keep only last 10 mode changes
  if (this.dualModePreferences.modeHistory.length > 10) {
    this.dualModePreferences.modeHistory = this.dualModePreferences.modeHistory.slice(-10);
  }
};

// Static method to find user by email (including password for authentication)
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email }).select('+password');
};

export const User = mongoose.model<IUser>('User', UserSchema);