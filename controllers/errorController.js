const AppError = require("../utils/AppError");

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value ${value}`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const error = Object.values(err.message).map((el) => el.message);
  const message = `Invalid input data ${error.join(", ")}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError(`Invalid token. Please login again`, 401);

const handleJWTExpired = (err) =>
  new AppError(`Login Expried please login Again`, 401);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  } else {
    res
      .status(err.statusCode)
      .render("error", { title: "Some error", msg: err.message });
  }
};

const sendUser = (err, req, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
    });
  } else {
    console.log(err);

    res.status(500).json({
      status: `error`,
      message: `Something went wrong `,
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || `error`;

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;
    if (error.name === "CastError") error = handleCastError(error);
    if (error.code === 11000) error = handleDuplicateDB(error);
    if (error.name === "ValidationError") error = handleValidationError(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError(error);
    if (error.name === "TokenExpiredError") error = handleJWTExpired(error);
    sendUser(error, req, res);
  }
};
