const Section = require('../models/Section');
const SubSection = require('../models/SubSection');
const { uploadImageToCloud } = require('../utils/imageUploader');

//create SubSection handler
exports.createSubSection = async (req, res) => {
    try {

        //fetch data from req body
        const { sectionId, title, description } = req.body;

        //fetch video file
        const video = req.files.video;

        //data validate
        if (!sectionId || !title || !description || !video) {
            return res.status(404).json({
                success: false,
                message: 'All fields are required',
            });
        }
        console.log("Video--->",video);

        //upload video to cloudinary
        const uploadDetails = await uploadImageToCloud(video, process.env.FOLDER_NAME);
        console.log("Upload Details--->",uploadDetails);

        //create a sub-Section in DB
        const subSectionDetails = await SubSection.create({
            title: title,
            timeDuration: `${uploadDetails.duration}`,
            description: description,
            videoUrl: uploadDetails.secure_url,
        });

        //update section with the subSections ObjectId
        const updatedSection = await Section.findByIdAndUpdate({ _id: sectionId },
            { $push: { subSection: subSectionDetails._id } }, { new: true }).populate("subSection");

        //return response
        return res.status(200).json({
            success: true,
            message: 'SubSection created Successfully',
            data: updatedSection,
        });
    }
    catch (error) {
        console.log(error);
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while creating the subSection',
            error: error.message,
        });
    }
}

//Update sub-section Handler
exports.updateSubSection = async (req, res) => {
    try {
      const { sectionId, title, description } = req.body
      const subSection = await SubSection.findById(sectionId)
  
      if (!subSection) {
        return res.status(404).json({
          success: false,
          message: "SubSection not found",
        })
      }
  
      if (title !== undefined) {
        subSection.title = title
      }
  
      if (description !== undefined) {
        subSection.description = description
      }
      if (req.files && req.files.video !== undefined) {
        const video = req.files.video
        const uploadDetails = await uploadImageToCloudinary(
          video,
          process.env.FOLDER_NAME
        )
        subSection.videoUrl = uploadDetails.secure_url
        subSection.timeDuration = `${uploadDetails.duration}`
      }
  
      await subSection.save()
  
      return res.json({
        success: true,
        message: "Section updated successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the section",
      })
    }
  }
  
//Delete sub-section handler
  exports.deleteSubSection = async (req, res) => {
    try {
      const { subSectionId, sectionId } = req.body
      await Section.findByIdAndUpdate(
        { _id: sectionId },
        {
          $pull: {
            subSection: subSectionId,
          },
        }
      )
      const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })
  
      if (!subSection) {
        return res.status(404).json({
             success: false, 
             message: "SubSection not found" 
            });
      }
  
      return res.json({
        success: true,
        message: "SubSection deleted successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the SubSection",
      })
    }
  }