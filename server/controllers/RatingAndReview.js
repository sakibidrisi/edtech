const Course = require('../models/Course');
const RatingAndReview = require('../models/RatingAndReview');
const { mongo, default: mongoose } = require("mongoose");

//createRating handler
exports.createRating = async (req, res) => {
    try {

        //gett user ID
        const userId = req.user.id;

        //fetch data from request body
        const { rating, review, courseId } = req.body;

        //check if user is enrolled or not
        courseDetails = await Course.findOne({ _id: courseId, studentsEnrolled: { $elemMatch: { $eq: userId } }, });

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: 'Student is not enrolled in the course',
            });
        }

        //check if student is already reviewed the course
        const alreadyReviewed = await RatingAndReview.findOne({
            course: courseId,
            user: userId,
        });

        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                message: 'Course is alreay reviewed by the User',
            });
        }

        //create rating and review
        const ratingReview = await RatingAndReview.create({
            rating: rating,
            reviews: review,
            course: courseId,
            user: userId,
        });

        //update course with this rating/reviews
        const updatedCourseDetails = await Course.findByIdAndUpdate({ _id: courseId },
            {
                $push: {
                    ratingAndReviews: ratingReview._id,
                }
            },
            { new: true });
        console.log(updatedCourseDetails);

        //send response
        return res.status(404).json({
            success: true,
            message: 'Rating and Reviews is created',
            ratingReview,
        });

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while creating rating and reviews',
        });
    }
};

//get Average rating Handler
exports.getAverageRating = async (req, res) => {
    try {
        //get course Id
        const courseId = req.body.courseId;

        //Calculate average rating
        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                }
            }
        ])

        //return rating
        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,
            });
        }

        //if not rating/review exist
        return res.status(200).json({
            success: true,
            message: 'Average rating is 0, no rating is given till now',
            averageRating: 0,
        });



    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

//get All rating/reviews Handler
exports.getAllRatingReview = async (req, res) => {
    try {
        //fetch all rating from DB
        const allReviews = await RatingAndReview.find({})
            .sort({ rating: 'desc' })
            .populate({
                path: 'user',
                select: 'firstName lastName email image',
            })
            .populate({
                path: 'course',
                select: 'courseName',
            })
            .exec();

        return res.status(200).json({
            success: true,
            message: 'All rating fetched successfully',
            data: allReviews,
        });

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}