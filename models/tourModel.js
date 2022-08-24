const mongoose = require("mongoose");
const { default: slugify } = require("slugify");
const User = require("./userModel");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "Name cannot be empty"],
      trim: true,
      maxLength: [40, `A tour name  must have more than or equal to 40`],
    },
    slug: String,
    duration: { type: Number, required: [true, `A tour must have a duration`] },
    maxGroupSize: {
      type: Number,
      required: [true, `A tour must have a group size`],
    },
    difficulty: {
      type: String,
      required: [true, `A tour must have a diffiulty`],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: `Invalid difficulty is provided`,
      },
    },
    price: { type: Number, required: [true, `Price cannot be empty`] },
    ratingAverage: { type: Number, default: 4.0 },
    ratingQuantity: { type: Number, default: 2.0 },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: `Discount cannot larger ${this.price} DIscount := ({VALUE})`,
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, `A tour must have a description`],
    },
    description: { type: String, trim: true },
    imageCover: { type: String, required: [true, `A tour must have image`] },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: Boolean,
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinater: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinater: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  }
);

tourSchema.virtual("durationWeeks").get(function () {
  if (this.duration) return this.duration / 7;
});

tourSchema.index({ price: 1, ratingAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

//virtual populate
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

// Document Middleware
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });
  next();
});

//embedding the users
// tourSchema.pre("save", async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

tourSchema.pre("save", function (next) {
  console.log(`will save document after this`);
  next();
});

tourSchema.post("save", function (doc, next) {
  console.log(doc);
  next();
});

// Query Middlware
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

// Aggreate Middleware
tourSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model("Tours", tourSchema);

module.exports = Tour;
