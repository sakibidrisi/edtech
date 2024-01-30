const Section = require('../models/Section');
const Course = require('../models/Course');

//create section handler
exports.createSection = async (req, res) => {
    try {

        //fetching data
        const { sectionName, courseId } = req.body;

        //data validation
        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'All feilds are required'
            });
        }

        //create new section
        const newSection = await Section.create({ sectionName });

        //update course with sections objectId
        const updatedCourse = await Course.findByIdAndUpdate(courseId, 
            { $push: { courseContent: newSection._id } }, 
            { new: true })
            .populate({
				path: "courseContent",
				populate: {
					path: "subSection",
				},
			})
			.exec();
        
        //return response
        return res.status(200).json({
            success: true,
            message: 'Section created Successfully',
            updatedCourse,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while creating the Section',
            error: error.message,
        });
    }
}

//update section handler
exports.updateSection = async (req, res) => {
    try {

        //data fetch
        const {sectionName,sectionId} = req.body;
        
        //data update
        const section = await Section.findByIdAndUpdate(sectionId, {sectionName}, {new: true});

        //return response
        return res.status(200).json({
            success: true,
            message: 'Section updated Successfully',
            section,
        });

       }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while updating the Section',
            error: error.message,
        });
    }
}

//delete section handler
exports.deleteSection = async (req, res) => {
    try {

        //Assuming that we are sending id in params
        const {sectionId} = req.body;

        //delete from DB
        await Section.findByIdAndDelete(sectionId);

        // TODO: Do we need to delete section ID from course Schema??

        //return response
        return res.status(200).json({
            success: true,
            message: 'Section deleted Successfully',
        });

       }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while deleting the Section',
            error: error.message,
        });
    }
}