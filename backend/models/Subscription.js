const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order_id: {
    type: String,
    required: true,
    unique: true
  },
  user_name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['reseller', 'store_owner'],
    required: true
  },
  plan: {
    type: String,
    required: true,
    enum: ['basic', 'standard', 'premium', 'enterprise']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  duration: {
    type: Number, // Duration in days
    required: true
  },
  start_date: {
    type: Date,
    default: Date.now
  },
  end_date: {
    type: Date,
    required: true
  },
  payment_method: {
    type: String,
    enum: ['razorpay', 'stripe', 'paypal', 'card'],
    default: 'razorpay'
  },
  payment_details: {
    razorpay_payment_id: String,
    razorpay_order_id: String,
    razorpay_signature: String,
    cardholder_name: String,
    card_last_four: String,
    expiry_month: String,
    expiry_year: String,
    payment_gateway_response: mongoose.Schema.Types.Mixed
  },
  features: {
    promotions_available: {
      type: Number,
      default: 0
    },
    promotions_used: {
      type: Number,
      default: 0
    },
    scans_available: {
      type: Number,
      default: 0
    },
    scans_used: [{
      scan_date: {
        type: Date,
        default: Date.now
      },
      qr_code_id: String,
      location: {
        latitude: Number,
        longitude: Number
      }
    }],
    analytics_enabled: {
      type: Boolean,
      default: false
    },
    priority_support: {
      type: Boolean,
      default: false
    },
    custom_branding: {
      type: Boolean,
      default: false
    }
  },
  auto_renewal: {
    type: Boolean,
    default: false
  },
  renewal_attempts: {
    type: Number,
    default: 0
  },
  last_renewal_attempt: {
    type: Date,
    default: null
  },
  cancelled_at: {
    type: Date,
    default: null
  },
  cancelled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  cancellation_reason: {
    type: String,
    default: null
  },
  refund_amount: {
    type: Number,
    default: 0
  },
  refund_date: {
    type: Date,
    default: null
  },
  refund_reason: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for better query performance
subscriptionSchema.index({ user_id: 1 });
subscriptionSchema.index({ order_id: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ type: 1 });
subscriptionSchema.index({ end_date: 1 });
subscriptionSchema.index({ created_at: -1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('is_active').get(function() {
  return this.status === 'completed' && this.end_date > new Date();
});

// Virtual for days remaining
subscriptionSchema.virtual('days_remaining').get(function() {
  if (this.status !== 'completed') return 0;
  const now = new Date();
  if (this.end_date <= now) return 0;
  return Math.ceil((this.end_date - now) / (1000 * 60 * 60 * 24));
});

// Method to check if user can use promotion
subscriptionSchema.methods.canUsePromotion = function() {
  return this.status === 'completed' && 
         this.features.promotions_used < this.features.promotions_available &&
         this.end_date > new Date();
};

// Method to check if user can scan QR
subscriptionSchema.methods.canScan = function() {
  return this.status === 'completed' && 
         this.features.scans_used.length < this.features.scans_available &&
         this.end_date > new Date();
};

// Method to use a promotion
subscriptionSchema.methods.usePromotion = async function() {
  if (!this.canUsePromotion()) {
    throw new Error('Cannot use promotion - limit reached or subscription inactive');
  }
  
  this.features.promotions_used += 1;
  return this.save();
};

// Method to add a scan
subscriptionSchema.methods.addScan = async function(scanData = {}) {
  if (!this.canScan()) {
    throw new Error('Cannot scan - limit reached or subscription inactive');
  }
  
  this.features.scans_used.push({
    scan_date: new Date(),
    qr_code_id: scanData.qr_code_id || null,
    location: scanData.location || null
  });
  
  return this.save();
};

// Auto-populate user details
subscriptionSchema.pre(['find', 'findOne'], function() {
  this.populate('user_id', 'full_name email role');
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
