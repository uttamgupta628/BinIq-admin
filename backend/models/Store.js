const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  store_name: {
    type: String,
    required: true,
    trim: true
  },
  user_latitude: {
    type: Number,
    default: null
  },
  user_longitude: {
    type: Number,
    default: null
  },
  address: {
    type: String,
    default: null
  },
  city: {
    type: String,
    default: null
  },
  state: {
    type: String,
    default: null
  },
  zip_code: {
    type: String,
    default: null
  },
  country: {
    type: String,
    default: null
  },
  google_maps_link: {
    type: String,
    default: null
  },
  website_url: {
    type: String,
    default: null
  },
  working_days: {
    type: String,
    default: null
  },
  working_time: {
    type: String,
    default: null
  },
  phone_number: {
    type: String,
    default: null
  },
  store_email: {
    type: String,
    default: null
  },
  facebook_link: {
    type: String,
    default: null
  },
  instagram_link: {
    type: String,
    default: null
  },
  twitter_link: {
    type: String,
    default: null
  },
  whatsapp_link: {
    type: String,
    default: null
  },
  followers: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  store_image: {
    type: String,
    default: null
  },
  store_images: [{
    type: String
  }],
  ratings: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  rating_count: {
    type: Number,
    default: 0
  },
  views_count: {
    type: Number,
    default: 0
  },
  favorited_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  liked_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followed_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  store_category: {
    type: String,
    default: null
  },
  store_description: {
    type: String,
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for geospatial queries
storeSchema.index({ user_latitude: 1, user_longitude: 1 });
storeSchema.index({ user_id: 1 });
storeSchema.index({ verified: 1 });
storeSchema.index({ city: 1, state: 1 });
storeSchema.index({ store_category: 1 });
storeSchema.index({ featured: 1 });

// Virtual for location
storeSchema.virtual('location').get(function() {
  if (this.user_latitude && this.user_longitude) {
    return {
      type: 'Point',
      coordinates: [this.user_longitude, this.user_latitude]
    };
  }
  return null;
});

// Method to calculate average rating
storeSchema.methods.calculateAverageRating = function() {
  if (this.comments.length === 0) return 0;
  
  const ratingsWithValues = this.comments.filter(comment => comment.rating);
  if (ratingsWithValues.length === 0) return 0;
  
  const sum = ratingsWithValues.reduce((acc, comment) => acc + comment.rating, 0);
  return Math.round((sum / ratingsWithValues.length) * 10) / 10;
};

// Update ratings before saving
storeSchema.pre('save', function(next) {
  if (this.isModified('comments')) {
    this.ratings = this.calculateAverageRating();
    this.rating_count = this.comments.filter(comment => comment.rating).length;
  }
  next();
});

module.exports = mongoose.model('Store', storeSchema);
