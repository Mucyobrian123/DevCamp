const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Bootcamp = require('../models/Bootcamp');
const geocoder = require('../utils/geocoder');
const path = require('path');
// const advancedResults = require('../middleware/advancedResults');
//@desc     get all bootcamps
//@routes   get/ api/v1/bootcamps
// access   Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
	res.status(200).json(res.advancedResults);
});

//@desc     get single bootcamp
//@routes   get/ api/v1/bootcamps/:id
// access   Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id);
	if (!bootcamp) {
		return next(
			new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404),
		);
	}
	res.status(200).json({ sucess: true, data: bootcamp });
});

//@desc     create new bootcamp
//@routes   post/ api/v1/bootcamps
// access   Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
	//add user to body
	req.body.user = req.user.id;

	//check for published bootcamps
	const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });
	// if the user in not an admin they can add one boootcamp

	if (publishedBootcamp && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`The User with ID ${req.user.id} has already published a bootcamp`,
				400,
			),
		);
	}
	const bootcamp = await Bootcamp.create(req.body);

	res.status(201).json({
		success: true,
		data: bootcamp,
	});
});

//@desc     Update  bootcamp
//@routes   put/ api/v1/bootcamps/:id
// access   Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
	let bootcamp = await Bootcamp.findById(req.params.id);
	if (!bootcamp) {
		return next(
			new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404),
		);
	}
	//make sure user is bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`user ${req.params.id} is not authorized to update this bootcamp`,
				401,
			),
		);
	}

	bootcamp = await Bootcamp.findOneAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	});
	res.status(200).json({ success: true, data: bootcamp });
});

//@desc     delete  bootcamp
//@routes   delete/ api/v1/bootcamps/:id
// access   Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id);
	if (!bootcamp) {
		return next(
			new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404),
		);
	}
	//make sure user is bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`user ${req.params.id} is not authorized to delete this bootcamp`,
				401,
			),
		);
	}
	bootcamp.remove();
	res.status(200).json({ success: true, data: {} });
});

//@desc     delete  bootcamp
//@routes   delete/ api/v1/bootcamps/:id
// access   Private
exports.getBootcampInRadius = asyncHandler(async (req, res, next) => {
	const { zipcode, distance } = req.params;

	//get lat lang form geocoder
	const loc = await geocoder.geocode(zipcode);
	const lat = loc[0].latitude;
	const lng = loc[0].longitude;

	//get radius using radians
	// divide dist by radius
	// earth radius is 3963 miles/6378 km

	const radius = distance / 3963;
	const bootcamps = await Bootcamp.find({
		location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
	});

	res.status(200).json({
		sucess: true,
		count: bootcamps.length,
		data: bootcamps,
	});
});

//@desc     upload pdhoto  bootcamp
//@routes   put api/v1/bootcamps/:id/photo
// access   Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id);
	if (!bootcamp) {
		return next(
			new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404),
		);
	}

	//make sure user is bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`user ${req.params.id} is not authorized to update this bootcamp`,
				401,
			),
		);
	}
	if (!req.files) {
		return next(new ErrorResponse(`Please upload a file`, 404));
	}
	const file = req.files.file;

	// make sure the image is a photo
	if (!file.mimetype.startsWith('image')) {
		return next(new ErrorResponse(`Please Upload an Image file`, 404));
	}
	//CHECK FILE SIZE
	if (file.size > process.env.MAX_FILE_UPLOAD) {
		return next(
			new ErrorResponse(
				`Please Upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
				404,
			),
		);
	}
	// create custom filename
	file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;
	file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
		if (err) {
			console.error(err);
			return next(new ErrorResponse(`Problem with file  Upload `, 404));
		}
		await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
		res.status(200).json({
			success: true,
			data: file.name,
		});
	});
});
