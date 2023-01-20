const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const crypto = require('crypto');
const { use } = require('../routes/auth');

//@desc     Register a User
//@routes   post/ api/v1/auth/register
// access   Public

exports.register = asyncHandler(async (req, res, next) => {
	const { name, email, password, role } = req.body;

	//create a user
	const user = await User.create({
		name,
		email,
		password,
		role,
	});

	//create token
	const token = user.getSignedJwtToken();

	sendTokenResponse(user, 200, res);
});

//@desc     login a User
//@routes   post/ api/v1/auth/login
// access   Public

exports.login = asyncHandler(async (req, res, next) => {
	const { email, password } = req.body;

	// validate email and password
	if (!email || !password) {
		return next(new ErrorResponse('Please provide email and passowrd', 400));
	}
	//check for user
	const user = await User.findOne({ email }).select('+password');
	if (!user) {
		return next(new ErrorResponse('Invalid Credentials', 401));
	}
	// check password match
	const isMatch = await user.matchPassword(password);

	if (!isMatch) {
		return next(new ErrorResponse('Invalid Credentials', 401));
	}

	sendTokenResponse(user, 200, res);
});

//@desc     get a current logged in User
//@routes   post/ api/v1/auth/me
// access   private
exports.updatePassword = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id).select('+password');

	//check current password
	if (!(await user.matchPassword(req.body.currentPassword))) {
		return next(new ErrorResponse('password is incorrect', 401));
	}
	user.password = req.body.newPassword;
	await user.save();
	sendTokenResponse(user, 200, res);
});

//@desc     get a current logged in User
//@routes   post/ api/v1/auth/me
// access   private
exports.getMe = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id);

	res.status(200).json({
		success: true,
		data: user,
	});
});

//@desc     gUpdate User Details
//@routes   PUT/ api/v1/auth/updatedetails
// access   private
exports.updateDetails = asyncHandler(async (req, res, next) => {
	const fieldsToUpdate = {
		name: req.body.name,
		email: req.body.email,
	};

	const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		success: true,
		data: user,
	});
});

//@desc     Forgot Password
//@routes   post/ api/v1/auth/forgotpassword
// access   public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email });

	if (!user) {
		return next(new ErrorResponse('There is no user with that email', 404));
	}

	//get reset token
	const resetToken = user.getResetPasswordToken();
	await user.save({ validateBeforeSave: false });

	// create reset url
	const resetUrl = `${req.protocol}://${req.get(
		'host'
	)}/api/v1/auth/resetpassword/${resetToken}`;

	const message = `You are receiving this email because you (or someone else) has requested to reset the password. Please make a PUT request to: \n\n${resetUrl} `;

	try {
		await sendEmail({
			email: user.email,
			subject: 'Password reset Token',
			message,
		});

		res.status(200).json({ success: true, data: 'email Sent' });
	} catch (err) {
		console.log(err);
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;

		await user.save({ validateBeforeSave: false });

		return next(new ErrorResponse('Email Could not be sent', 500));
	}
});

//@desc		Reset Password
//@routes   PUT / api/v1/auth/resetpassword/:resettoken
// access   public
exports.resetPassword = asyncHandler(async (req, res, next) => {
	//get hashed token

	const resetPasswordToken = crypto
		.createHash('sha256')
		.update(req.params.resettoken)
		.digest('hex');

	const user = await User.findOne({
		resetPasswordToken,
		resetPasswordExpire: { $gt: Date.now() },
	});

	if (!user) {
		return next(new ErrorResponse('Invalid Token', 400));
	}

	// set new password

	user.password = req.body.password;
	user.resetPasswordToken = undefined;
	user.resetPasswordExpire = undefined;
	await user.save();

	sendTokenResponse(user, 200, res);
});

// get a token from model, create coolkie and send response
const sendTokenResponse = (user, statusCode, res) => {
	// create token
	const token = user.getSignedJwtToken();
	const options = {
		expires: new Date(
			Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 100
		),
		httpOnly: true,
	};
	if (process.env.NODE_env === 'production') {
		options.secure = true;
	}
	res.status(statusCode).cookie('token', token, options).json({
		success: true,
		token,
	});
};
