const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  suggestion: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['reseller', 'store_owner'],
    required: true
  },
  category: {
    type: String,
    enum: ['bug_report', 'feature_request', 'general_feedback', 'complaint', 'compliment'],
    default: 'general_feedback'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  reply: {
    type: String,
    default: null,
    maxlength: 2000
  },
  replied_at: {
    type: Date,
    default: null
  },
  replied_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  attachments: [{
    filename: String,
    file_url: String,
    file_type: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  internal_notes: [{
    note: {
      type: String,
      required: true
    },
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    added_at: {
      type: Date,
      default: Date.now
    }
  }],
  is_anonymous: {
    type: Boolean,
    default: false
  },
  device_info: {
    user_agent: String,
    platform: String,
    browser: String,
    version: String
  },
  follow_up_required: {
    type: Boolean,
    default: false
  },
  follow_up_date: {
    type: Date,
    default: null
  },
  escalated: {
    type: Boolean,
    default: false
  },
  escalated_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  escalated_at: {
    type: Date,
    default: null
  },
  resolution_time: {
    type: Number, // Time in minutes
    default: null
  },
  satisfaction_rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for better query performance
feedbackSchema.index({ user_id: 1 });
feedbackSchema.index({ type: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ priority: 1 });
feedbackSchema.index({ category: 1 });
feedbackSchema.index({ created_at: -1 });
feedbackSchema.index({ rating: 1 });

// Virtual for reply status
feedbackSchema.virtual('has_reply').get(function() {
  return !!this.reply;
});

// Virtual for time since creation
feedbackSchema.virtual('time_since_creation').get(function() {
  const now = new Date();
  const diffInMs = now - this.created_at;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
});

// Method to add reply
feedbackSchema.methods.addReply = async function(reply, repliedBy) {
  this.reply = reply;
  this.replied_at = new Date();
  this.replied_by = repliedBy;
  this.status = 'resolved';
  
  // Calculate resolution time
  const resolutionTimeMs = this.replied_at - this.created_at;
  this.resolution_time = Math.floor(resolutionTimeMs / (1000 * 60)); // Convert to minutes
  
  return this.save();
};

// Method to escalate feedback
feedbackSchema.methods.escalate = async function(escalatedTo, reason = null) {
  this.escalated = true;
  this.escalated_to = escalatedTo;
  this.escalated_at = new Date();
  this.priority = 'urgent';
  
  if (reason) {
    this.internal_notes.push({
      note: `Escalated: ${reason}`,
      added_by: escalatedTo,
      added_at: new Date()
    });
  }
  
  return this.save();
};

// Method to add internal note
feedbackSchema.methods.addInternalNote = async function(note, addedBy) {
  this.internal_notes.push({
    note,
    added_by: addedBy,
    added_at: new Date()
  });
  
  return this.save();
};

// Static method to get feedback statistics
feedbackSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalFeedback: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        resolvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        storeOwnerFeedback: {
          $sum: { $cond: [{ $eq: ['$type', 'store_owner'] }, 1, 0] }
        },
        resellerFeedback: {
          $sum: { $cond: [{ $eq: ['$type', 'reseller'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalFeedback: 0,
    averageRating: 0,
    pendingCount: 0,
    resolvedCount: 0,
    storeOwnerFeedback: 0,
    resellerFeedback: 0
  };
};

// Auto-populate user details
feedbackSchema.pre(['find', 'findOne'], function() {
  this.populate('user_id', 'full_name email role');
  this.populate('replied_by', 'full_name email');
});

module.exports = mongoose.model('Feedback', feedbackSchema);
