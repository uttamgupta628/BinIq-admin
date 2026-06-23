const express = require('express');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Get all subscriptions
router.get('/all', adminAuth, async (req, res) => {
  try {
    const subscriptions = await Subscription.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_details'
        }
      },
      {
        $addFields: {
          user_details: { $arrayElemAt: ['$user_details', 0] }
        }
      },
      {
        $project: {
          subscription_id: '$_id',
          order_id: '$order_id',
          user: {
            user_id: '$user_details._id',
            full_name: '$user_details.full_name',
            email: '$user_details.email',
            role: {
              $switch: {
                branches: [
                  { case: { $eq: ['$user_details.role', 2] }, then: 'reseller' },
                  { case: { $eq: ['$user_details.role', 3] }, then: 'store_owner' }
                ],
                default: 'user'
              }
            },
            store_name: '$user_details.store_name',
            total_promotions: '$promotions_available',
            used_promotions: '$promotions_used',
            total_scans: '$scans_available'
          },
          type: {
            $switch: {
              branches: [
                { case: { $eq: ['$user_details.role', 2] }, then: 'reseller' },
                { case: { $eq: ['$user_details.role', 3] }, then: 'store_owner' }
              ],
              default: 'user'
            }
          },
          plan: '$plan',
          amount: '$amount',
          status: '$status',
          date: '$created_at',
          duration: '$duration',
          payment_method: {
            cardholder_name: '$payment_details.cardholder_name',
            expiry_month: '$payment_details.expiry_month',
            expiry_year: '$payment_details.expiry_year'
          }
        }
      },
      {
        $sort: { date: -1 }
      }
    ]);

    res.json({
      success: true,
      data: subscriptions
    });

  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions'
    });
  }
});

// Get subscription statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = await Subscription.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0]
            }
          },
          activeSubscriptions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          pendingPayments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          failedPayments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
            }
          },
          totalSubscriptions: { $sum: 1 }
        }
      }
    ]);

    const result = stats[0] || {
      totalRevenue: 0,
      activeSubscriptions: 0,
      pendingPayments: 0,
      failedPayments: 0,
      totalSubscriptions: 0
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get subscription stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription statistics'
    });
  }
});

// Update subscription status
router.patch('/:subscriptionId/status', adminAuth, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { 
        status,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      message: 'Subscription status updated successfully',
      subscription
    });

  } catch (error) {
    console.error('Update subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription status'
    });
  }
});

module.exports = router;
