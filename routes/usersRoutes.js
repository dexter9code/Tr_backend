const express = require("express");
const router = express.Router();
const {
  singup,
  singin,
  forgotPassword,
  resetPassword,
  updatePassword,
  protectRoutes,
  restrictTo,
  logout,
} = require("../controllers/authController");
const userController = require("../controllers/userController");
const {
  createUser,
  deleteUser,
  getAllUsers,
  getUser,
  updateUser,
  UpdateData,
  deleteMe,
  getMe,
} = require("../controllers/userController");

router.post(`/signup`, singup);
router.post(`/signin`, singin);
router.get(`/logout`, logout);

router.post(`/forgotPassword`, forgotPassword);
router.patch(`/resetPassword/:token`, resetPassword);

router.use(protectRoutes); // after this point protectRoute middle will apply to all

router.patch(`/updateMyPassword`, protectRoutes, updatePassword);
router.patch(
  `/updateMe`,
  protectRoutes,
  userController.uploadUserPhoto,
  userController.resizeUserImage,
  UpdateData
);
router.delete(`/deleteMe`, protectRoutes, deleteMe);
router.route(`/me`).get(getMe, getUser);

router.use(restrictTo("admin"));

router.route(`/`).get(getAllUsers).post(createUser);
router.route(`/:id`).get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
