const express = require('express');
const router = express.Router();

// Import controller
const reviewController = require('../../controllers/reviews/reviewController');

// Import middleware
const { authenticate, requireAdmin, requireBuyer, optionalAuth } = require('../../middleware/auth/authMiddleware');
const { validateBody, validateParams, validateQuery } = require('../../middleware/validation/validationMiddleware');
const { reviewLimiter, apiLimiter } = require('../../middleware/rateLimiter');

// Import validation schemas
const { reviewValidators } = require('../../validators/reviewValidators');

// Public routes (no authentication required)
router.get('/product/:productId',
  optionalAuth,
  validateParams(reviewValidators.getProductReviews),
  validateQuery(reviewValidators.getProductReviews),
  reviewController.getProductReviews
);

router.get('/:reviewId',
  optionalAuth,
  validateParams(reviewValidators.getReviewById),
  reviewController.getReviewById
);

// Buyer routes (buyer authentication required)
router.post('/product/:productId',
  authenticate,
  requireBuyer,
  reviewLimiter,
  validateParams(reviewValidators.createReview),
  validateBody(reviewValidators.createReview),
  reviewController.createReview
);

router.put('/:reviewId',
  authenticate,
  requireBuyer,
  reviewLimiter,
  validateParams(reviewValidators.updateReview),
  validateBody(reviewValidators.updateReview),
  reviewController.updateReview
);

router.delete('/:reviewId',
  authenticate,
  requireBuyer,
  reviewLimiter,
  validateParams(reviewValidators.deleteReview),
  reviewController.deleteReview
);

router.get('/my-reviews',
  authenticate,
  requireBuyer,
  validateQuery(reviewValidators.getMyReviews),
  reviewController.getMyReviews
);

// Admin routes (admin authentication required)
router.get('/',
  authenticate,
  requireAdmin,
  validateQuery(reviewValidators.getAllReviews),
  reviewController.getAllReviews
);

router.put('/:reviewId/status',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(reviewValidators.updateReviewStatus),
  validateBody(reviewValidators.updateReviewStatus),
  reviewController.updateReviewStatus
);

router.delete('/:reviewId/admin',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(reviewValidators.deleteReviewAdmin),
  reviewController.deleteReviewAdmin
);

// Review statistics (admin only)
router.get('/stats/overview',
  authenticate,
  requireAdmin,
  reviewController.getReviewStats
);

router.get('/stats/product/:productId',
  authenticate,
  requireAdmin,
  validateParams(reviewValidators.getProductReviewStats),
  reviewController.getProductReviewStats
);

router.get('/stats/rating-distribution',
  authenticate,
  requireAdmin,
  validateQuery(reviewValidators.getRatingDistribution),
  reviewController.getRatingDistribution
);

// Review management (admin only)
router.get('/pending',
  authenticate,
  requireAdmin,
  validateQuery(reviewValidators.getPendingReviews),
  reviewController.getPendingReviews
);

router.get('/reported',
  authenticate,
  requireAdmin,
  validateQuery(reviewValidators.getReportedReviews),
  reviewController.getReportedReviews
);

router.post('/:reviewId/report',
  authenticate,
  requireBuyer,
  reviewLimiter,
  validateParams(reviewValidators.reportReview),
  validateBody(reviewValidators.reportReview),
  reviewController.reportReview
);

router.post('/:reviewId/approve',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(reviewValidators.approveReview),
  reviewController.approveReview
);

router.post('/:reviewId/reject',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(reviewValidators.rejectReview),
  validateBody(reviewValidators.rejectReview),
  reviewController.rejectReview
);

module.exports = router;
