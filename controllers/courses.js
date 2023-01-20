const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Course = require('../models/Course');
const Bootcamp = require('../models/Bootcamp');
//@desc     get all courses
//@routes   get/ api/v1/courses
//@routes   get/ api/v1/bootcamps/:bootcampId/courses
// access   Public

exports.getCourses = asyncHandler(async (req, res, next) => {
	let query;
	if (req.params.bootcampId) {
		const courses = await Course.find({ bootcamp: req.params.bootcampId });
		return res.status(200).json({
			success: true,
			count: courses.length,
			data: courses,
		});
	} else {
		res.status(200).json(res.advancedResults);
	}
});

//@desc     get a sinlge courses
//@routes   get/ api/v1/courses/:id
// access   Public

exports.getCourse = asyncHandler(async (req, res, next) => {
	const course = await Course.findById(req.params.id).populate({
		path: 'bootcamp',
		select: 'name description',
	});

	if (!Course) {
		return next(
			new ErrorResponse(`No Course with the id of ${req.params.id}`),
			404,
		);
	}
	res.status(200).json({
		success: true,
		data: course,
	});
});

//@desc     add course
//@routes   post/ api/v1/bootcamps/:bootcampId/courses
// access   private

exports.addCourse = asyncHandler(async (req, res, next) => {
	req.body.bootcamp = req.params.bootcampId;

	req.body.user = req.user.id;

	const bootcamp = await Bootcamp.findById(req.params.bootcampId);

	if (!bootcamp) {
		return next(
			new ErrorResponse(`No Bootcamp with the id of ${req.params.bootcampId}`),
			404,
		);
	}
	//make sure user is bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`user ${req.user.id} is not authorized to Add a course to  ${bootcamp._id}`,
				401,
			),
		);
	}
	const course = await Course.create(req.body);
	res.status(200).json({
		success: true,
		data: course,
	});
});

//@desc     update course
//@routes   put api/v1/courses/:id
// access   private

exports.updateCourse = asyncHandler(async (req, res, next) => {
	let course = await Course.findById(req.params.id);

	if (!course) {
		return next(
			new ErrorResponse(`No course with the id of ${req.params.id}`),
			404,
		);
	}
	//make sure user is course owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`user ${req.user.id} is not authorized to update course  ${course._id}`,
				401,
			),
		);
	}
	course = await Course.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	});
	res.status(200).json({
		success: true,
		data: course,
	});
});

//@desc     Delete course
//@routes   delete api/v1/courses/:id
// access   private

exports.deleteCourse = asyncHandler(async (req, res, next) => {
	const course = await Course.findById(req.params.id);

	if (!course) {
		return next(
			new ErrorResponse(`No course with the id of ${req.params.id}`),
			404,
		);
	}
	//make sure user is bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`user ${req.user.id} is not authorized to delete a course to  ${course._id}`,
				401,
			),
		);
	}

	await course.remove();
	res.status(200).json({
		success: true,
		data: {},
	});
});
