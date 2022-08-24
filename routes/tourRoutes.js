const express = require("express");
const { protectRoutes, restrictTo } = require("../controllers/authController");
const router = express.Router();
const reviewRouter = require("./reviewRoutes");

const {
  createTour,
  deleteTour,
  getAllTours,
  patchTour,
  getTour,
  aliasTopTours,
  getTourStats,
  getMontlyPlan,
  getToursWithIn,
  uploadTourImages,
  resizeTourImages,
} = require("../controllers/tourController");

// router.param("id", checkID);

router.use(`/:tourId/reviews`, reviewRouter);

router
  .route(`/tours-within/:distance/center/:latlng/unit/:unit`)
  .get(getToursWithIn);

router.route(`/get-5cheapTours`).get(aliasTopTours, getAllTours);
router.route(`/tour-stats`).get(getTourStats);
router
  .route(`/monthly-plan/:year`)
  .get(
    protectRoutes,
    restrictTo("admin", "lead-guide", "guide"),
    getMontlyPlan
  );
router
  .route(`/`)
  .get(getAllTours)
  .post(protectRoutes, restrictTo("admin", "lead-guide"), createTour);
router
  .route(`/:id`)
  .get(getTour)
  .patch(
    protectRoutes,
    restrictTo("admin", "lead-guide"),
    uploadTourImages,
    resizeTourImages,
    patchTour
  )
  .delete(protectRoutes, restrictTo("admin", "lead-guide"), deleteTour);

// router
//   .route(`/:tourId/reviews`)
//   .post(protectRoutes, restrictTo("user", "guide"), createReview);

module.exports = router;
