const express = require('express');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Feedback = require('../models/Feedback');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Get paid users statistics
router.get('/paid-users', adminAuth, async (req, res) => {
  try {
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Get total paid users (users with active subscriptions)
    const totalPaidUsers = await Subscription.countDocuments({
      status: 'completed'
    });

    // Get paid users from last month
    const lastMonthPaidUsers = await Subscription.countDocuments({
      status: 'completed',
      created_at: { $lt: thisMonth }
    });

    // Get paid users from this month
    const thisMonthPaidUsers = await Subscription.countDocuments({
      status: 'completed',
      created_at: { $gte: thisMonth }
    });

    // Calculate percentage increase
    let monthlyIncreasePercentage = 0;
    if (lastMonthPaidUsers > 0) {
      monthlyIncreasePercentage = ((thisMonthPaidUsers - lastMonthPaidUsers) / lastMonthPaidUsers) * 100;
    } else if (thisMonthPaidUsers > 0) {
      monthlyIncreasePercentage = 100;
    }

    res.json({
      success: true,
      data: {
        totalPaidUsers,
        monthlyIncreasePercentage: Math.round(monthlyIncreasePercentage * 100) / 100
      }
    });

  } catch (error) {
    console.error('Get paid users stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch paid users statistics'
    });
  }
});

// Get store owners statistics
router.get('/store-owners', adminAuth, async (req, res) => {
  try {
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Get total store owners
    const totalStoreOwners = await User.countDocuments({ role: 3 });

    // Get store owners from last month
    const lastMonthStoreOwners = await User.countDocuments({
      role: 3,
      created_at: { $lt: thisMonth }
    });

    // Get store owners from this month
    const thisMonthStoreOwners = await User.countDocuments({
      role: 3,
      created_at: { $gte: thisMonth }
    });

    // Calculate percentage increase
    let monthlyIncreasePercentage = 0;
    if (lastMonthStoreOwners > 0) {
      monthlyIncreasePercentage = ((thisMonthStoreOwners - lastMonthStoreOwners) / lastMonthStoreOwners) * 100;
    } else if (thisMonthStoreOwners > 0) {
      monthlyIncreasePercentage = 100;
    }

    res.json({
      success: true,
      data: {
        totalStoreOwners,
        monthlyIncreasePercentage: Math.round(monthlyIncreasePercentage * 100) / 100
      }
    });

  } catch (error) {
    console.error('Get store owners stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store owners statistics'
    });
  }
});

// Get resellers statistics
router.get('/resellers', adminAuth, async (req, res) => {
  try {
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Get total resellers
    const totalResellers = await User.countDocuments({ role: 2 });

    // Get resellers from last month
    const lastMonthResellers = await User.countDocuments({
      role: 2,
      created_at: { $lt: thisMonth }
    });

    // Get resellers from this month
    const thisMonthResellers = await User.countDocuments({
      role: 2,
      created_at: { $gte: thisMonth }
    });

    // Calculate percentage increase
    let monthlyIncreasePercentage = 0;
    if (lastMonthResellers > 0) {
      monthlyIncreasePercentage = ((thisMonthResellers - lastMonthResellers) / lastMonthResellers) * 100;
    } else if (thisMonthResellers > 0) {
      monthlyIncreasePercentage = 100;
    }

    res.json({
      success: true,
      data: {
        totalResellers,
        monthlyIncreasePercentage: Math.round(monthlyIncreasePercentage * 100) / 100
      }
    });

  } catch (error) {
    console.error('Get resellers stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resellers statistics'
    });
  }
});

// Get revenue statistics
router.get('/revenue', adminAuth, async (req, res) => {
  try {
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Get total revenue from completed subscriptions
    const totalRevenueResult = await Subscription.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Get revenue from last month
    const lastMonthRevenueResult = await Subscription.aggregate([
      { 
        $match: { 
          status: 'completed',
          created_at: { $lt: thisMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;

    // Get revenue from this month
    const thisMonthRevenueResult = await Subscription.aggregate([
      { 
        $match: { 
          status: 'completed',
          created_at: { $gte: thisMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const thisMonthRevenue = thisMonthRevenueResult[0]?.total || 0;

    // Calculate percentage increase
    let monthlyIncreasePercentage = 0;
    if (lastMonthRevenue > 0) {
      monthlyIncreasePercentage = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } else if (thisMonthRevenue > 0) {
      monthlyIncreasePercentage = 100;
    }

    res.json({
      success: true,
      data: {
        totalRevenue,
        monthlyIncreasePercentage: Math.round(monthlyIncreasePercentage * 100) / 100
      }
    });

  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue statistics'
    });
  }
});

// Get quick statistics for dashboard
router.get('/quick-stats', adminAuth, async (req, res) => {
  try {
    // Get premium users (users with active subscriptions)
    const totalUsers = await User.countDocuments({ role: { $in: [2, 3] } });
    const premiumUsersCount = await Subscription.countDocuments({ status: 'completed' });
    const premiumPercentage = totalUsers > 0 ? (premiumUsersCount / totalUsers) * 100 : 0;

    // Get average rating from feedback
    const avgRatingResult = await Feedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const averageRating = avgRatingResult[0]?.avgRating || 0;

    // Get pending replies count
    const pendingReplies = await Feedback.countDocuments({ reply: { $exists: false } });

    // Get active subscriptions
    const activeSubscriptions = await Subscription.countDocuments({ status: 'completed' });

    // Get new users today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const newUsersToday = await User.countDocuments({
      created_at: { $gte: todayStart, $lte: todayEnd },
      role: { $in: [2, 3] }
    });

    res.json({
      success: true,
      data: {
        premiumUsers: {
          count: premiumUsersCount,
          percentage: Math.round(premiumPercentage * 100) / 100
        },
        averageRating: Math.round(averageRating * 10) / 10,
        pendingReplies,
        activeSubscriptions,
        newUsersToday
      }
    });

  } catch (error) {
    console.error('Get quick stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quick statistics'
    });
  }
});

// Get recent activity (recent registrations)
router.get('/recent-activity', adminAuth, async (req, res) => {
  try {
    const recentUsers = await User.find({
      role: { $in: [2, 3] }, // Only resellers and store owners
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
    .select('full_name role created_at')
    .sort({ created_at: -1 })
    .limit(10);

    const recentActivity = recentUsers.map(user => {
      const hoursAgo = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60));
      
      return {
        name: user.full_name,
        type: user.role === 2 ? 'reseller' : 'store-owner',
        timeInHours: hoursAgo
      };
    });

    res.json({
      success: true,
      data: recentActivity
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity'
    });
  }
});

module.exports = router;
