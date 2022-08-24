const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const multer = require("multer");
const sharp = require("sharp");

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/users");
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError(`Not a image! please upload a image`, 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserImage = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
};

const filterObj = (obj, ...allowedData) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedData.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.UpdateData = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError(
        `You cannot change password here please use /updatePassword`,
        400
      )
    );
  }

  // filtered out unwanted data like password
  const filteredBody = filterObj(req.body, "name", "email");
  if (req.file) filteredBody.photo = req.file.filename;

  // updating user data
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  // sending response
  res.status(200).json({
    status: `Success`,
    data: { updatedUser },
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: `Success`,
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "Not-valid",
    message: `This route is under construction better to use /singup`,
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: "Not-valid",
    message: `This route is under construction`,
  });
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.deleteUser = factory.deleteOne(User);
