const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const bookingController = require("../controllers/bookingController");

router.get(
  `/checkout-session/:tourId`,
  authController.protectRoutes,
  bookingController.getCheckOutSession
);

module.exports = router;
