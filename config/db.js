const { default: mongoose } = require('mongoose');
const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI, {
			useUnifiedTopology: true,
			useNewUrlParser: true,
		});
		console.log(
			`Mongo DB Connected ${conn.connection.host}`.cyan.underline.bold,
		);
	} catch (error) {
		console.log(error);
	}
};

module.exports = connectDB;
