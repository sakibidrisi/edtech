const Profile = require('../models/Profile');
const User = require('../models/User');
const { uploadImageToCloud } = require("../utils/imageUploader");

//update profile handler
exports.updateProfile = async (req,res) => {
    try{
        //fetch data
        const {dateOfBirth="", about="", contactNumber, gender} = req.body;

        //get user id
        const id = req.user.id;

        //find profile by user ID
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;
        let profile = await Profile.findById(profileId);

        //update profile
        profile.dateOfBirth = dateOfBirth;
        profile.contactNumber = contactNumber;
        profile.about = about;
        profile.gender = gender;

        //Save the updated profile
        await profile.save();

        //return response
        return res.status(200).json({
            success: true,
            message: 'Profile updated Successfully',
            profile,
        });

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while updating the Profile',
            error: error.message,
        });
    }
}

//delete account handler
exports.deleteAccount = async (req,res) => {
    try{
        //fetch id
        const id = req.user.id;

        //validate id
        const userDetails = await User.findById(id);
        if(!userDetails){
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        //delete Profile
        await Profile.findByIdAndDelete({_id: userDetails.additionalDetails});

        //HW: unenroll user from all enrolled courses

        //delete User
        await User.findByIdAndDelete({_id: id});

        //return response
        return res.status(200).json({
            success: true,
            message: 'User deleted Successfully',
        });

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while Deleting the Account',
            error: error.message,
        });
    }
}

//get all User Details handler
exports.getAllUserDetails = async (req,res) => {
    try{
        //fetch id
        const id = req.user.id;

        //validation and get user Details
        const userDetails = await User.findById(id).populate('additionalDetails').exec();

        console.log(userDetails);

        //return response
        return res.status(200).json({
            success: true,
            message: 'User data fetched Successfully',
            data: userDetails,
        });

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while fetching the User details',
            error: error.message,
        });
    }
}

//Update display Picture handler
exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloud(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};

//Get enrolled course handler
exports.getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      const userDetails = await User.findOne({
        _id: userId,
      })
        .populate("courses")
        .exec()
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};