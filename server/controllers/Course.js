const Course = require('../models/Course');
const Category = require("../models/Category");
const User = require('../models/User');
const { uploadImageToCloud } = require('../utils/imageUploader');

//createCourse handler
exports.createCourse = async (req, res) => {
    try {

        // Get user ID from request object
		const userId = req.user.id;

        //fetch data
        let { courseName, courseDescription, whatYouWillLearn, price, tag, category, status, instructions } = req.body;

        //Get thumbnail image from request files
        const thumbnail = req.files.thumbnailImage

        //validation Check if any of the required fields are missing
        if (!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail || !category) {
            return res.status(400).json({
                success: false,
                message: 'ALL fields are required',
            });
        }

        if (!status || status === undefined) {
			status = "Draft";
		}

        //Check if the user is an instructor
        const instructorDetails = await User.findById(userId,{
			accountType: "Instructor",
		});
        //TODO: verify that userId and instructorDetails._id are same or not?

        if (!instructorDetails) {
            return res.status(404).json({
                success: false,
                message: 'Instructor Details Not Found',
            });
        }

        //check Category details and validate
        const categoryDetails = await Category.findById(category);

		if (!categoryDetails) {
			return res.status(404).json({
				success: false,
				message: "Category Details Not Found",
			});
		}

        //upload image to cloudinary
        const thumbnailImage = await uploadImageToCloud(thumbnail, process.env.FOLDER_NAME);

        //create an entry for new course in DB
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            whatYouWillLearn: whatYouWillLearn,
            instructor: instructorDetails._id,
            price,
            tag: tag,
            thumbnail: thumbnailImage.secure_url,
            category: categoryDetails._id,
            status: status,
			instructions: instructions,
        })

        //add the new course to the user schema of instructor
        await User.findByIdAndUpdate({ _id: instructorDetails._id },
            {
                $push: {
                    courses: newCourse._id,
                }
            },
            { new: true })

       // Add the new course to the Categories
		await Category.findByIdAndUpdate(
			{ _id: category },
			{
				$push: {
					course: newCourse._id,
				},
			},
			{ new: true });

        //send response
        return res.status(200).json({
            success: true,
            message: 'Course create successfully',
            data: newCourse,
        });

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create course',
            error: error.message,
        });
    }
}


//getAllCourses handler
exports.getAllCourses = async (req, res) => {
    try {
        const allCourses = await Course.find({},{
            courseName: true,
            price: true,
            thumbnail: true,
            instructor: true,
            ratingAndReviews: true,
            studentsEnroled: true,
        })
        .populate("instructor")
        .exec();

        return res.status(200).json({
            success: true,
            message: 'Data for all courses fetched Successfully',
            data: allCourses,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: `Can't Fetch Course Data`,
            error: error.message,
        });
    }
}

//Get Course details
exports.getCourseDetails = async (req, res) => {
    try{
        //get course ID
        const {courseId} = req.body;

        //find course details
        const courseDetails = await Course.find(
            {_id: courseId})
            .populate({
                path: 'instructor',
                populate:{
                    path: 'additionalDetails',
                }
            })
            .populate('category')
            // .populate('ratingAndReviews')
            .populate({
                path: 'courseContent',
                populate:{
                    path: 'subSection',
                }
            })
            .exec();
    
        //Validation
        if(!courseDetails){
            return res.status(400).json({
                success: false,
                message: `Could not find the course with ID ${courseId}`,
            });
        }

        //success response
        return res.status(200).json({
            success: true,
            message: 'Course details fetched Successfully',
            data: courseDetails,
        });

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
