const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseName:{
        type: String,
    },
    courseDescription:{
        type: String,
    },
    instructor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    whatYouWillLearn:{
        type: String,
    },
    courseContent:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Section',
        }
    ],
    ratingAndReviews:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RatingAndReviws',
        }
    ],
    price:{
        type: String,
    },
    thumbnail:{
        type: String,
    },
    tag:{
        type: [String],
        ref: 'Tags',
    },
    category: {
		type: mongoose.Schema.Types.ObjectId,
		// required: true,
		ref: "Category",
	},
    studentsEnrolled:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }
    ],
    instructions: {
		type: [String],
	},
	status: {
		type: String,
		enum: ["Draft", "Published"],
	},
})

module.exports = mongoose.model('Course', courseSchema);