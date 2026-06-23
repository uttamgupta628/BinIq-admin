const express = require('express');
const Notification = require('../models/Notification');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Get all notifications
router.get('/', adminAuth, async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ created_at: -1 })
      .populate('created_by', 'full_name email');

    res.json(notifications);

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Create new notification
router.post('/', adminAuth, async (req, res) => {
  try {
    const { heading, content, type } = req.body;

    if (!heading || !content) {
      return res.status(400).json({
        success: false,
        message: 'Heading and content are required'
      });
    }

    // Validate type
    const validTypes = ['all', 'reseller', 'store_owner'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be one of: ' + validTypes.join(', ')
      });
    }

    const notification = new Notification({
      heading: heading.trim(),
      content: content.trim(),
      type: type || 'all',
      created_by: req.user.userId
    });

    await notification.save();

    // Send notification to target users
    await sendNotificationToUsers(notification);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification_id: notification._id,
      notification
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
});

// Update notification
router.put('/:notificationId', adminAuth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { heading, content, type } = req.body;

    if (!heading || !content) {
      return res.status(400).json({
        success: false,
        message: 'Heading and content are required'
      });
    }

    const validTypes = ['all', 'reseller', 'store_owner'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be one of: ' + validTypes.join(', ')
      });
    }

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        heading: heading.trim(),
        content: content.trim(),
        type: type || 'all',
        updated_at: new Date(),
        updated_by: req.user.userId
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification updated successfully',
      notification
    });

  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification'
    });
  }
});

// Delete notification
router.delete('/:notificationId', adminAuth, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// Get notification statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          allUserNotifications: {
            $sum: { $cond: [{ $eq: ['$type', 'all'] }, 1, 0] }
          },
          resellerNotifications: {
            $sum: { $cond: [{ $eq: ['$type', 'reseller'] }, 1, 0] }
          },
          storeOwnerNotifications: {
            $sum: { $cond: [{ $eq: ['$type', 'store_owner'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalNotifications: 0,
      allUserNotifications: 0,
      resellerNotifications: 0,
      storeOwnerNotifications: 0
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics'
    });
  }
});

// Helper function to send notifications to target users
async function sendNotificationToUsers(notification) {
  try {
    let userFilter = {};
    
    if (notification.type === 'reseller') {
      userFilter.role = 2;
    } else if (notification.type === 'store_owner') {
      userFilter.role = 3;
    }
    // For 'all' type, no filter is applied

    const users = await User.find(userFilter).select('_id');
    
    // Create user notifications (for in-app notifications)
    const userNotifications = users.map(user => ({
      user_id: user._id,
      notification_id: notification._id,
      heading: notification.heading,
      content: notification.content,
      type: notification.type,
      read: false
    }));

    // If you have a UserNotification model, insert them
    // await UserNotification.insertMany(userNotifications);

    console.log(`Notification sent to ${users.length} users`);
    
  } catch (error) {
    console.error('Send notification to users error:', error);
  }
}

module.exports = router;
