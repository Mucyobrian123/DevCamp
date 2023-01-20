const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
// load env vars
dotenv.config({ path: './config/config.env' });

//Connect to the DB
const app = express();
// body parser
app.use(express.json());
app.use(cookieParser());
//Route files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
// dev logging middleware
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

//file Uploading
app.use(fileupload());
// set static folder
app.use(express.static(path.join(__dirname, 'public')));
// Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	connectDB();
	console.log(`App running on port ${PORT}`.yellow.italic.underline);
	console.log('Connected to the BackEnd!!');
});
