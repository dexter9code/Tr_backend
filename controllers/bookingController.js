const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/ApiFeatures");
const AppError = require("../utils/AppError");
const catchAsync = require(`../utils/catchAsync`);

exports.getCheckOutSession = catchAsync(async (req, res, next) => {
  const id = req.params.tourId;
  const tour = await Tour.findById(id);
  if (!tour) return next(new AppError(`Invalid tour id `, 400));

  //creating stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.get("host")}/`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `https://images.unsplash.com/photo-1660674033326-9b857d88bf59?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1632&q=80`,
        ],
        amount: tour.price * 100,
        currency: "usd",
        quantity: 1,
      },
    ],
  });

  // creating response
  res.status(200).json({
    status: `Success`,
    session,
  });
});
