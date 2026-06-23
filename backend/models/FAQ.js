const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  answer: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: Number,
    enum: [2, 3, null], // 2: Reseller, 3: Store Owner, null: Both
    default: null
  },
  category: {
    type: String,
    enum: ['general', 'account', 'billing', 'technical', 'features', 'troubleshooting'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  views: {
    type: Number,
    default: 0
  },
  helpful_votes: {
    positive: {
      type: Number,
      default: 0
    },
    negative: {
      type: Number,
      default: 0
    },
    users_voted: [{
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      vote_type: {
        type: String,
        enum: ['positive', 'negative']
      },
      voted_at: {
        type: Date,
        default: Date.now
      }
    }]
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
  language: {
    type: String,
    default: 'en'
  },
  related_faqs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ'
  }],
  search_keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  last_reviewed: {
    type: Date,
    default: null
  },
  review_required: {
    type: Boolean,
    default: false
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
  version: {
    type: Number,
    default: 1
  },
  version_history: [{
    version: Number,
    question: String,
    answer: String,
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    change_reason: String
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for better query performance
faqSchema.index({ type: 1 });
faqSchema.index({ status: 1 });
faqSchema.index({ category: 1 });
faqSchema.index({ priority: 1 });
faqSchema.index({ created_at: -1 });
faqSchema.index({ views: -1 });
faqSchema.index({ tags: 1 });
faqSchema.index({ search_keywords: 1 });

// Text index for search functionality
faqSchema.index({
  question: 'text',
  answer: 'text',
  tags: 'text',
  search_keywords: 'text'
}, {
  weights: {
    question: 10,
    tags: 5,
    search_keywords: 5,
    answer: 1
  }
});

// Virtual for target audience display
faqSchema.virtual('target_audience').get(function() {
  if (this.type === 2) return 'Resellers';
  if (this.type === 3) return 'Store Owners';
  return 'Both';
});

// Virtual for helpfulness score
faqSchema.virtual('helpfulness_score').get(function() {
  const total = this.helpful_votes.positive + this.helpful_votes.negative;
  if (total === 0) return 0;
  return Math.round((this.helpful_votes.positive / total) * 100);
});

// Method to increment view count
faqSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

// Method to add helpful vote
faqSchema.methods.addHelpfulVote = async function(userId, voteType) {
  // Check if user has already voted
  const existingVote = this.helpful_votes.users_voted.find(
    vote => vote.user_id.toString() === userId.toString()
  );
  
  if (existingVote) {
    // Update existing vote
    if (existingVote.vote_type === 'positive') {
      this.helpful_votes.positive -= 1;
    } else {
      this.helpful_votes.negative -= 1;
    }
    
    existingVote.vote_type = voteType;
    existingVote.voted_at = new Date();
  } else {
    // Add new vote
    this.helpful_votes.users_voted.push({
      user_id: userId,
      vote_type: voteType,
      voted_at: new Date()
    });
  }
  
  // Update vote counts
  if (voteType === 'positive') {
    this.helpful_votes.positive += 1;
  } else {
    this.helpful_votes.negative += 1;
  }
  
  return this.save();
};

// Method to create version history before updating
faqSchema.methods.createVersionHistory = function(updatedBy, changeReason = null) {
  this.version_history.push({
    version: this.version,
    question: this.question,
    answer: this.answer,
    updated_by: updatedBy,
    updated_at: new Date(),
    change_reason: changeReason
  });
  
  this.version += 1;
};

// Pre-save middleware to create version history
faqSchema.pre('save', function(next) {
  if (this.isModified('question') || this.isModified('answer')) {
    if (!this.isNew && this.updated_by) {
      this.createVersionHistory(this.updated_by, 'FAQ content updated');
    }
  }
  next();
});

// Static method to search FAQs
faqSchema.statics.searchFAQs = async function(query, userType = null, options = {}) {
  const {
    limit = 10,
    skip = 0,
    category = null,
    status = 'published'
  } = options;
  
  let filter = {
    status,
    $text: { $search: query }
  };
  
  // Filter by user type
  if (userType && [2, 3].includes(userType)) {
    filter.$or = [
      { type: userType },
      { type: null }
    ];
  }
  
  // Filter by category
  if (category) {
    filter.category = category;
  }
  
  return this.find(filter)
    .select({ score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, views: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get FAQ statistics
faqSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalFAQs: { $sum: 1 },
        publishedFAQs: {
          $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
        },
        draftFAQs: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        resellerFAQs: {
          $sum: { $cond: [{ $eq: ['$type', 2] }, 1, 0] }
        },
        storeOwnerFAQs: {
          $sum: { $cond: [{ $eq: ['$type', 3] }, 1, 0] }
        },
        generalFAQs: {
          $sum: { $cond: [{ $eq: ['$type', null] }, 1, 0] }
        },
        totalViews: { $sum: '$views' },
        averageHelpfulness: {
          $avg: {
            $cond: [
              { $gt: [{ $add: ['$helpful_votes.positive', '$helpful_votes.negative'] }, 0] },
              {
                $multiply: [
                  { $divide: ['$helpful_votes.positive', { $add: ['$helpful_votes.positive', '$helpful_votes.negative'] }] },
                  100
                ]
              },
              0
            ]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalFAQs: 0,
    publishedFAQs: 0,
    draftFAQs: 0,
    resellerFAQs: 0,
    storeOwnerFAQs: 0,
    generalFAQs: 0,
    totalViews: 0,
    averageHelpfulness: 0
  };
};

module.exports = mongoose.model('FAQ', faqSchema);
