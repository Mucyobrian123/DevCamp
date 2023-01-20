const ErrorResponse = require('../utils/errorResponse');

const errorHanlder = (err, req, res, next) => {
	let error = { ...err };
	error.message = error.message;
	console.log(err);
	//mongoose bad object
	if (err.name === 'CastError') {
		const message = `Resource not found with id ${req.value}`;
		error = new ErrorResponse(message, 404);
	}

	//mongoose duplicate key
	if (err.code === 11000) {
		const message = 'Duplicate Field value Entered';
		error = new ErrorResponse(message, 400);
	}

	//mongoose validation error

	if (err.name === 'ValidationError') {
		const message = Object.values(err.errors).map((val) => val.message);
		error = new ErrorResponse(message, 400);
	}
	res.status(err.statusCode || 500).json({
		sucess: false,
		error: err.message || 'Server Error',
	});
};

module.exports = errorHanlder;
