const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Store = require('../models/Store');
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find admin user (role 1 = admin)
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      role: 1 // Admin role
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      token,
      user_details: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get all store owners with detailed information
router.get('/all-details-store-owner', adminAuth, async (req, res) => {
  try {
    const storeOwners = await User.aggregate([
      {
        $match: { role: 3 } // Store owner role
      },
      {
        $lookup: {
          from: 'stores',
          localField: '_id',
          foreignField: 'user_id',
          as: 'store'
        }
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'user_id',
          as: 'subscription'
        }
      },
      {
        $addFields: {
          store: { $arrayElemAt: ['$store', 0] },
          subscription: { $arrayElemAt: ['$subscription', 0] }
        }
      },
      {
        $project: {
          password: 0 // Exclude password from response
        }
      }
    ]);

    const formattedData = storeOwners.map(owner => ({
      user: {
        ...owner,
        subscription: owner.subscription || null,
        total_promotions: owner.subscription?.promotions_available || 0,
        used_promotions: owner.subscription?.promotions_used || 0,
        total_scans: owner.subscription?.scans_available || 0,
        scans_used: owner.subscription?.scans_used || []
      },
      store: owner.store || {}
    }));

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Get store owners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store owners'
    });
  }
});

// Get all resellers with detailed information  
router.get('/all-details-resellar', adminAuth, async (req, res) => {
  try {
    const resellers = await User.aggregate([
      {
        $match: { role: 2 } // Reseller role
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'user_id',
          as: 'subscription'
        }
      },
      {
        $addFields: {
          subscription: { $arrayElemAt: ['$subscription', 0] }
        }
      },
      {
        $project: {
          password: 0 // Exclude password from response
        }
      }
    ]);

    const formattedData = resellers.map(reseller => ({
      user: {
        ...reseller,
        subscription: reseller.subscription || null,
        total_scans: reseller.subscription?.scans_available || 0,
        scans_used: reseller.subscription?.scans_used || []
      }
    }));

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Get resellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resellers'
    });
  }
});

// Approve store owner
router.post('/approve-store-owner', adminAuth, async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Update user verification status
    await User.findByIdAndUpdate(user_id, { verified: true });
    
    // Update store verification status if exists
    await Store.findOneAndUpdate(
      { user_id }, 
      { verified: true }
    );

    res.json({
      success: true,
      message: 'Store owner approved successfully'
    });

  } catch (error) {
    console.error('Approve store owner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve store owner'
    });
  }
});

// Reject store owner
router.post('/reject-store-owner', adminAuth, async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Update user verification status
    await User.findByIdAndUpdate(user_id, { verified: false });
    
    // Update store verification status if exists
    await Store.findOneAndUpdate(
      { user_id }, 
      { verified: false }
    );

    res.json({
      success: true,
      message: 'Store owner rejected successfully'
    });

  } catch (error) {
    console.error('Reject store owner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject store owner'
    });
  }
});

// Delete user account
router.delete('/delete-account', adminAuth, async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Delete user and related data
    await Promise.all([
      User.findByIdAndDelete(user_id),
      Store.findOneAndDelete({ user_id }),
      Feedback.deleteMany({ user_id })
    ]);

    res.json({
      success: true,
      message: 'User account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user account'
    });
  }
});

// Get all feedback
router.get('/feedback', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('user_id', 'full_name email')
      .sort({ created_at: -1 });

    const formattedFeedback = feedback.map(fb => ({
      _id: fb._id,
      rating: fb.rating,
      user_name: fb.user_id?.full_name || 'Unknown User',
      user_email: fb.user_id?.email || 'No email',
      suggestion: fb.suggestion,
      user_id: fb.user_id?._id || null,
      type: fb.type,
      status: fb.reply ? 'replied' : 'pending',
      reply: fb.reply || null,
      created_at: fb.created_at,
      __v: fb.__v
    }));

    res.json(formattedFeedback);

  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
});

// Reply to feedback
router.post('/feedback/reply', adminAuth, async (req, res) => {
  try {
    const { feedback_id, reply } = req.body;

    if (!feedback_id || !reply) {
      return res.status(400).json({
        success: false,
        message: 'Feedback ID and reply are required'
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      feedback_id,
      { 
        reply,
        replied_at: new Date(),
        replied_by: req.user.userId
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      message: 'Feedback replied successfully',
      feedback
    });

  } catch (error) {
    console.error('Reply feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reply to feedback'
    });
  }
});

module.exports = router;
