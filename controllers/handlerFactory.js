const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/ApiFeatures");

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc)
      return new AppError(
        `No doucment found with this ${req.params.id} id`,
        404
      );

    res.status(204).json({
      status: `Sucess`,
      data: null,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: "Success",
      data: { data: doc },
    });
  });

exports.UpdateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc)
      return next(
        new AppError(
          `can't find the document with id ${req.params.id} Please check Id`,
          404
        )
      );

    res.status(200).json({
      status: `Sucess`,
      data: { data: doc },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc) return next(new AppError(`Invalid Id is provided `, 400));

    res.status(200).json({
      status: `Succes`,
      data: { data: doc },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .fieldLimiting()
      .pagination();

    const doc = await features.query;
    res.status(200).json({
      status: "Success",
      result: doc.length,
      data: { data: doc },
    });
  });
