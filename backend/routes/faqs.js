const express = require('express');
const FAQ = require('../models/FAQ');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Get all FAQs
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    
    let filter = {};
    if (type && ['2', '3'].includes(type)) {
      filter.type = parseInt(type);
    }

    const faqs = await FAQ.find(filter)
      .sort({ created_at: -1 });

    res.json(faqs);

  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs'
    });
  }
});

// Create new FAQ
router.post('/', adminAuth, async (req, res) => {
  try {
    const { question, answer, type } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required'
      });
    }

    // Validate type (2 = reseller, 3 = store owner, null = both)
    let faqType = null;
    if (type && [2, 3].includes(parseInt(type))) {
      faqType = parseInt(type);
    }

    const faq = new FAQ({
      question: question.trim(),
      answer: answer.trim(),
      type: faqType,
      created_by: req.user.userId
    });

    await faq.save();

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      faq
    });

  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create FAQ'
    });
  }
});

// Update FAQ
router.put('/:faqId', adminAuth, async (req, res) => {
  try {
    const { faqId } = req.params;
    const { question, answer, type } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required'
      });
    }

    // Validate type
    let faqType = null;
    if (type && [2, 3].includes(parseInt(type))) {
      faqType = parseInt(type);
    }

    const faq = await FAQ.findByIdAndUpdate(
      faqId,
      {
        question: question.trim(),
        answer: answer.trim(),
        type: faqType,
        updated_at: new Date(),
        updated_by: req.user.userId
      },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    res.json({
      success: true,
      message: 'FAQ updated successfully',
      faq
    });

  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update FAQ'
    });
  }
});

// Delete FAQ
router.delete('/:faqId', adminAuth, async (req, res) => {
  try {
    const { faqId } = req.params;

    const faq = await FAQ.findByIdAndDelete(faqId);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });

  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete FAQ'
    });
  }
});

// Get FAQ statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = await FAQ.aggregate([
      {
        $group: {
          _id: null,
          totalFAQs: { $sum: 1 },
          resellerFAQs: {
            $sum: { $cond: [{ $eq: ['$type', 2] }, 1, 0] }
          },
          storeOwnerFAQs: {
            $sum: { $cond: [{ $eq: ['$type', 3] }, 1, 0] }
          },
          generalFAQs: {
            $sum: { $cond: [{ $eq: ['$type', null] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalFAQs: 0,
      resellerFAQs: 0,
      storeOwnerFAQs: 0,
      generalFAQs: 0
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get FAQ stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ statistics'
    });
  }
});

module.exports = router;
