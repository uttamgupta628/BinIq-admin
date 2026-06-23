const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  store_name: {
    type: String,
    default: null
  },
  role: {
    type: Number,
    enum: [1, 2, 3], // 1: Admin, 2: Reseller, 3: Store Owner
    required: true
  },
  dob: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: null
  },
  phone_number: {
    type: String,
    default: null
  },
  address: {
    type: String,
    default: null
  },
  expertise_level: {
    type: String,
    enum: ['beginner', 'intermediate', 'expert'],
    default: null
  },
  profile_image: {
    type: String,
    default: null
  },
  verified: {
    type: Boolean,
    default: false
  },
  subscription: {
    type: String,
    default: null
  },
  subscription_start: {
    type: Date,
    default: null
  },
  subscription_end: {
    type: Date,
    default: null
  },
  card_information: {
    card_number: {
      type: String,
      default: null
    },
    cardholder_name: {
      type: String,
      default: null
    },
    expiry_month: {
      type: String,
      default: null
    },
    expiry_year: {
      type: String,
      default: null
    },
    cvc: {
      type: String,
      default: null
    }
  },
  email_verified: {
    type: Boolean,
    default: false
  },
  email_verification_token: {
    type: String,
    default: null
  },
  password_reset_token: {
    type: String,
    default: null
  },
  password_reset_expires: {
    type: Date,
    default: null
  },
  last_login: {
    type: Date,
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.email_verification_token;
  delete userObject.password_reset_token;
  return userObject;
};

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ created_at: -1 });

module.exports = mongoose.model('User', userSchema);
