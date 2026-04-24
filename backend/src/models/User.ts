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
  /**
   * Legacy password field. Retained on the schema as optional so pre-existing
   * bcrypt hashes are preserved until the final migration removes them. New
   * users created via magic-link have no password set. No code path reads
   * this field after the magic-link cutover.
   */
  password?: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;

  // Terms of Service acceptance tracking (legal protection)
  termsAcceptedAt?: Date;
  termsVersion?: string;
  termsAcceptedIp?: string;

  // Anti-abuse tracking (prevent bot spam, mass registration)
  registrationIp?: string;
  registrationUserAgent?: string;
  emailVerifiedAt?: Date;

  // Email verification reminder tracking
  emailVerificationReminderDismissed?: boolean;

  // Affiliate tracking (for partner referrals like Josh Lupo)
  affiliateCode?: string;
  affiliateCodeSetAt?: Date;

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
  // Legacy field. Kept optional to preserve existing bcrypt hashes; new
  // magic-link-created accounts leave this unset.
  password: {
    type: String,
    required: false,
    select: false
  },
  firstName: {
    type: String,
    required: false,
    default: '',
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: false,
    default: '',
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
  // Terms of Service acceptance tracking
  termsAcceptedAt: {
    type: Date
  },
  termsVersion: {
    type: String
  },
  termsAcceptedIp: {
    type: String
  },
  // Anti-abuse tracking
  registrationIp: {
    type: String,
    index: true // For admin investigation of abuse patterns
  },
  registrationUserAgent: {
    type: String
  },
  emailVerifiedAt: {
    type: Date
  },
  // Email verification reminder tracking
  emailVerificationReminderDismissed: {
    type: Boolean,
    default: false
  },
  // Affiliate tracking (partner referrals like Josh Lupo)
  affiliateCode: {
    type: String,
    required: false,
    default: null,
    index: true, // For querying Josh's referrals
    trim: true
  },
  affiliateCodeSetAt: {
    type: Date,
    required: false
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

// Hash password before saving — only runs for legacy password-set code paths.
// Magic-link users never populate this field, so the hook is a no-op for them.
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  if (!this.password) return next();

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to check password (legacy; kept so existing tests/tools
// that reference it still compile. Magic-link flow never calls this.)
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
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