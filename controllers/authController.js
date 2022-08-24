const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/email");
const Email = require("../utils/email");

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = createToken(user._id);

  const coookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV == "production") coookieOptions.secure = true;

  res.cookie("jwt", token, coookieOptions);

  // removing password from response
  user.password = undefined;

  res.status(statusCode).json({
    status: `Success`,
    token,
    data: { user },
  });
};

exports.singup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  const url = `${req.protocol}://${req.get("host")}/api/v1/users/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.singin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email && !password)
    return new AppError(`Email or Password is not provided`, 400);

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError(`Invalid Email or Password`, 401));

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: `Success` });
};

exports.protectRoutes = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (res.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) return next(new AppError(`Not logged In`, 401));

  // verification of token
  const decode = await promisify(jwt.verify)(token, process.env.JWT_KEY);

  // check if user still exists
  const freshUser = await User.findById(decode.id);
  if (!freshUser) return next(new AppError(`The User no loger exits`, 401));

  // check if user changed password after jwt issued
  if (freshUser.changedPasswordAfter(decode.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  req.user = freshUser;
  // res.local.user = freshUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    if (res.cookies.jwt) {
      const token = req.cookies.jwt;
      const decode = await promisify(jwt.verify)(token, process.env.JWT_KEY);
      const freshUser = await User.findById(decode.id);
      if (!freshUser) return next();
      if (freshUser.changedPasswordAfter(decode.iat)) {
        return next();
      }
      //accessing the user in pug template
      res.locals.user = freshUser;
      return next();
    }
  } catch (error) {
    console.log(error.message);
    return next();
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // get user by post email
  const user = await User.findOne({ email: req.body.email });
  if (!user) return new AppError(`No User found with ${req.body.email}`, 404);

  //generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // send email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a Patch request with your new password to: ${resetURL}.\n If you dont want to change the password just ignore it`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: `Your password reset token (valid for 10minutes)`,
    //   message,
    // });

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: `Success`,
      message: `Email is send`,
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError(`Error sending the E-mail`, 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // getting user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // if token has not expired & there is user then reset password
  if (!user) {
    return next(new AppError(`Token is invalid or has expired`, 400));
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save();

  // log the user in ,send jwt
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // const user = await User.findById(req.user.id).select("+password");

  // // if posted current password is correct
  // if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
  //   return next(new AppError(`Input password is wrong`, 401));
  // }

  // // updating password
  // user.password = req.body.password;
  // user.confirmPassword = req.body.confirmPassword;
  // await user.save();

  // //sending response back
  // createSendToken(user, 200, res);
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
