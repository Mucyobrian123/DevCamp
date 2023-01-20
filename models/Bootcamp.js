const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');
const BootcampSChema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Please add name'],
			unique: true,
			trim: true,
			maxLength: [50, 'name can not be above 50 chars'],
		},
		slug: String,
		description: {
			type: String,
			required: [true, 'please add a description'],
			maxLength: [500, 'Desc can not be above 500 chars'],
		},
		website: {
			type: String,
			match: [
				/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
				'please use a valid url with http or https',
			],
		},
		phone: {
			type: String,
			maxlength: [20, 'enter a phone number'],
		},
		email: {
			type: String,
			match: [
				/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
				'Please add a valid email',
			],
		},
		address: {
			type: String,
			required: [true, 'Please add ur address'],
		},
		location: {
			// use GeoJSON
			type: {
				type: String,
				enum: ['Point'],
				required: false,
			},
			coordinates: {
				type: [Number],
				required: false,
				index: '2dsphere',
			},
			formattedAddress: String,
			street: String,
			city: String,
			state: String,
			zipcode: String,
			country: String,
		},
		careers: {
			type: [String],
			required: true,
			enum: [
				'Web Development',
				'Mobile Development',
				'UI/UX',
				'Data Science',
				'Business',
				'others',
			],
		},
		averageRating: {
			type: Number,
			min: [1, 'Rating must be atleast 1'],
			max: [10, 'ratign must be atmost 10'],
		},
		averageCost: Number,
		photo: {
			type: String,
			default: 'no-pic.jpg',
		},
		housing: {
			type: Boolean,
			default: false,
		},
		jobAssistance: {
			type: Boolean,
			default: false,
		},
		jobGuarantee: {
			type: Boolean,
			default: false,
		},
		acceptGi: {
			type: Boolean,
			default: false,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		user: {
			type: mongoose.Schema.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

// create bootcamp slug from the name

BootcampSChema.pre('save', function (next) {
	this.slug = slugify(this.name, { lower: true });
	//console.log('Slugify ran', this.name);
	next();
});

//GEO code and create location field
BootcampSChema.pre('save', async function (next) {
	const loc = await geocoder.geocode(this.address);
	this.location = {
		type: 'Point',
		coordinates: [loc[0].longitude, loc[0].latitude],
		formattedAddress: loc[0].formattedAddress,
		street: loc[0].streetName,
		city: loc[0].city,
		state: loc[0].stateCode,
		zipCode: loc[0].zipcode,
		country: loc[0].countryCode,
	};

	//do not save address in db
	this.address = undefined;
	next();
});

//cascade delete courses when bootcamp is deleted
BootcampSChema.pre('remove', async function (next) {
	console.log(`courses being removed ${this._id}`);
	await this.model('Course').deleteMany({ bootcamp: this._id });
	next();
});

// reverse populate with virtual
BootcampSChema.virtual('courses', {
	ref: 'Course',
	localField: '_id',
	foreignField: 'bootcamp',
	justOne: false,
});
module.exports = mongoose.model('Bootcamp', BootcampSChema);
