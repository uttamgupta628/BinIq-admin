const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['all', 'reseller', 'store_owner'],
    default: 'all'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['announcement', 'update', 'maintenance', 'promotion', 'alert', 'reminder'],
    default: 'announcement'
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'cancelled'],
    default: 'sent'
  },
  scheduled_for: {
    type: Date,
    default: null
  },
  sent_at: {
    type: Date,
    default: null
  },
  expires_at: {
    type: Date,
    default: null
  },
  action_url: {
    type: String,
    default: null
  },
  action_text: {
    type: String,
    default: null
  },
  image_url: {
    type: String,
    default: null
  },
  icon: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'announcement'],
    default: 'info'
  },
  target_criteria: {
    user_roles: [{
      type: Number,
      enum: [2, 3] // 2: Reseller, 3: Store Owner
    }],
    subscription_status: [{
      type: String,
      enum: ['active', 'inactive', 'expired']
    }],
    user_locations: [{
      country: String,
      state: String,
      city: String
    }],
    registration_date_range: {
      from: Date,
      to: Date
    }
  },
  delivery_stats: {
    total_recipients: {
      type: Number,
      default: 0
    },
    delivered_count: {
      type: Number,
      default: 0
    },
    read_count: {
      type: Number,
      default: 0
    },
    clicked_count: {
      type: Number,
      default: 0
    },
    failed_count: {
      type: Number,
      default: 0
    }
  },
  delivery_methods: {
    in_app: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    campaign_id: String,
    source: String,
    utm_parameters: mongoose.Schema.Types.Mixed
  },
  auto_delete_after: {
    type: Number, // Days after which to auto-delete
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for better query performance
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ created_at: -1 });
notificationSchema.index({ scheduled_for: 1 });
notificationSchema.index({ expires_at: 1 });
notificationSchema.index({ tags: 1 });

// Virtual for delivery rate
notificationSchema.virtual('delivery_rate').get(function() {
  if (this.delivery_stats.total_recipients === 0) return 0;
  return Math.round((this.delivery_stats.delivered_count / this.delivery_stats.total_recipients) * 100);
});

// Virtual for read rate
notificationSchema.virtual('read_rate').get(function() {
  if (this.delivery_stats.delivered_count === 0) return 0;
  return Math.round((this.delivery_stats.read_count / this.delivery_stats.delivered_count) * 100);
});

// Virtual for click rate
notificationSchema.virtual('click_rate').get(function() {
  if (this.delivery_stats.read_count === 0) return 0;
  return Math.round((this.delivery_stats.clicked_count / this.delivery_stats.read_count) * 100);
});

// Virtual for is expired
notificationSchema.virtual('is_expired').get(function() {
  return this.expires_at && this.expires_at < new Date();
});

// Virtual for is scheduled
notificationSchema.virtual('is_scheduled').get(function() {
  return this.scheduled_for && this.scheduled_for > new Date();
});

// Method to mark as sent
notificationSchema.methods.markAsSent = async function() {
  this.status = 'sent';
  this.sent_at = new Date();
  return this.save();
};

// Method to schedule notification
notificationSchema.methods.schedule = async function(scheduledDate) {
  this.status = 'scheduled';
  this.scheduled_for = scheduledDate;
  return this.save();
};

// Method to cancel notification
notificationSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  return this.save();
};

// Method to update delivery stats
notificationSchema.methods.updateDeliveryStats = async function(stats) {
  Object.assign(this.delivery_stats, stats);
  return this.save();
};

// Method to increment read count
notificationSchema.methods.incrementReadCount = async function() {
  this.delivery_stats.read_count += 1;
  return this.save();
};

// Method to increment click count
notificationSchema.methods.incrementClickCount = async function() {
  this.delivery_stats.clicked_count += 1;
  return this.save();
};

// Static method to get notifications for user
notificationSchema.statics.getForUser = async function(userRole, options = {}) {
  const {
    limit = 20,
    skip = 0,
    status = 'sent',
    includeExpired = false
  } = options;
  
  let filter = {
    status,
    $or: [
      { type: 'all' },
      { type: userRole === 2 ? 'reseller' : 'store_owner' }
    ]
  };
  
  // Exclude expired notifications unless specified
  if (!includeExpired) {
    filter.$or = [
      { expires_at: null },
      { expires_at: { $gt: new Date() } }
    ];
  }
  
  return this.find(filter)
    .sort({ created_at: -1 })
    .limit(limit)
    .skip(skip)
    .populate('created_by', 'full_name');
};

// Static method to get scheduled notifications
notificationSchema.statics.getScheduled = async function() {
  return this.find({
    status: 'scheduled',
    scheduled_for: { $lte: new Date() }
  }).populate('created_by', 'full_name');
};

// Static method to clean up expired notifications
notificationSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    expires_at: { $lt: new Date() },
    auto_delete_after: { $exists: true }
  });
  
  return result.deletedCount;
};

// Static method to get notification statistics
notificationSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalNotifications: { $sum: 1 },
        sentNotifications: {
          $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
        },
        scheduledNotifications: {
          $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
        },
        draftNotifications: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        allUserNotifications: {
          $sum: { $cond: [{ $eq: ['$type', 'all'] }, 1, 0] }
        },
        resellerNotifications: {
          $sum: { $cond: [{ $eq: ['$type', 'reseller'] }, 1, 0] }
        },
        storeOwnerNotifications: {
          $sum: { $cond: [{ $eq: ['$type', 'store_owner'] }, 1, 0] }
        },
        totalRecipients: { $sum: '$delivery_stats.total_recipients' },
        totalDelivered: { $sum: '$delivery_stats.delivered_count' },
        totalRead: { $sum: '$delivery_stats.read_count' },
        totalClicked: { $sum: '$delivery_stats.clicked_count' }
      }
    }
  ]);
  
  const result = stats[0] || {
    totalNotifications: 0,
    sentNotifications: 0,
    scheduledNotifications: 0,
    draftNotifications: 0,
    allUserNotifications: 0,
    resellerNotifications: 0,
    storeOwnerNotifications: 0,
    totalRecipients: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalClicked: 0
  };
  
  // Calculate rates
  result.deliveryRate = result.totalRecipients > 0 ? 
    Math.round((result.totalDelivered / result.totalRecipients) * 100) : 0;
  result.readRate = result.totalDelivered > 0 ? 
    Math.round((result.totalRead / result.totalDelivered) * 100) : 0;
  result.clickRate = result.totalRead > 0 ? 
    Math.round((result.totalClicked / result.totalRead) * 100) : 0;
  
  return result;
};

module.exports = mongoose.model('Notification', notificationSchema);
