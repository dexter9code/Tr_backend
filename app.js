const express = require("express");
const morgan = require("morgan");
const app = express();
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const path = require("path");
const cookieParser = require("cookie-parser");

const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/usersRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const viewRouter = require("./routes/viewRoutes");
const bookingRouter = require("./routes/bookingRoutes");

const AppError = require(`./utils/AppError`);
const globalErrorHanlder = require("./controllers/errorController");

app.set(`view engine`, `pug`);
app.set(`views`, path.join(__dirname, "views"));

//Global-middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: `Too many request recevied from this IP please try again after 1 hour`,
});
app.use("/api", limiter);

// Body parser
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
// Data sanitization against noSql query injection
app.use(mongoSanitize());

//data sanitization
app.use(xss());

// Prevent duplicate query strings
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingQuantity",
      "ratingAverage",
      "maxGroupSize",
      "price",
      "difficulty",
    ],
  })
);

app.use((req, res, next) => {
  console.log(`Hello from other side`);
  console.log(req.cookies);
  next();
});
//routes

app.use(`/`, viewRouter);
app.use(`/api/v1/tours`, tourRouter);
app.use(`/api/v1/users`, userRouter); //mounting a router on to a new route
app.use(`/api/v1/reviews`, reviewRouter);
app.use(`/api/v1/bookings`, bookingRouter);

// Handling unHandles routes
app.all(`*`, function (req, res, next) {
  // res.status(404).json({
  //   status: `Invalid`,
  //   message: `Can't find route with ${req.originalUrl}`,
  // });

  // const err = new Error(`Can't find route with ${req.originalUrl}`);
  // err.status = `fail`;
  // err.statusCode = "404";

  next(new AppError(`Can't find route with ${req.originalUrl}`, 404));
});

// Global Error Handling
app.use(globalErrorHanlder);

module.exports = app;
