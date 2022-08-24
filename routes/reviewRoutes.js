const express = require("express");
const { protectRoutes, restrictTo } = require("../controllers/authController");
const {
  getAllReviews,
  getReview,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
} = require("../controllers/reviewController");
const router = express.Router({ mergeParams: true });

router
  .route(`/`)
  .get(getAllReviews)
  .post(
    protectRoutes,
    restrictTo("user", "guide", "admin"),
    setTourUserIds,
    createReview
  );
router
  .route(`/:id`)
  .get(getReview)
  .patch(protectRoutes, restrictTo("user", "admin"), updateReview)
  .delete(protectRoutes, restrictTo("user", "admin"), deleteReview);

module.exports = router;
