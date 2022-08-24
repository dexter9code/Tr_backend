const express = require("express");
const { isLoggedIn } = require("../controllers/authController");
const router = express.Router();
const {
  getOverview,
  getTourTemplate,
  getLoginTemplate,
  userTemplate,
  updateUserData,
} = require("../controllers/viewsController");

router.get(`/`, getOverview);
router.get(`/tour/:slug`, getTourTemplate);
router.get(`/login`, getLoginTemplate);
router.get(`/me`, userTemplate);

router.post(`/submit-user-data`, updateUserData);
module.exports = router;
