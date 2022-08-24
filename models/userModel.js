const cryto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: [3, `should be more than 3 character`],
    maxLength: [30, `Max limit reached should be less than 30`],
    trim: true,
    required: [true, `Name is required field`],
  },
  email: {
    type: String,
    unique: true,
    required: [true, `Email can't be empty`],
    lowercase: true,
    validate: [validator.isEmail, `Please provide a valid Email`],
  },
  photo: { type: String, default: "default.jpg" },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: `user`,
  },
  password: {
    type: String,
    minLength: [5, `Password length too short must be more than 5 character`],
    required: [true, `Password is required`],
    select: false,
  },
  confirmPassword: {
    type: String,
    minLength: [5, `Password length too short must be more than 5 character`],
    required: [true, `Password is required`],
    validate: {
      validator: function (el) {
        return this.password === el;
      },
      message: `Input Password and confirm password doesnot match`,
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: { type: Boolean, default: true, select: false },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.confirmPassword = undefined;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this point to current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (
  realPassword,
  userPassword
) {
  return await bcrypt.compare(realPassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = cryto.randomBytes(32).toString("hex");
  this.passwordResetToken = cryto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 5 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model(`User`, userSchema);

module.exports = User;
