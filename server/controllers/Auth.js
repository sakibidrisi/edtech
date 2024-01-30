const Profile = require('../models/Profile');
const User = require('../models/User');
const OTP = require('../models/OTP');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mailSender = require('../utils/mailSender');
const { passwordUpdated } = require('../mail/templates/passwordUpdate');

require('dotenv').config();

//Send OTP Handler
exports.sendOTP = async (req, res) => {
    try {
        //fetch email from request body
        const { email } = req.body;

        //check if user already exist
        const checkUserPresent = await User.findOne({ email });

        //if user already exisit return a response
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: 'User already registered',
            })
        }

        //generate OTP
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        //check otp is unique or not
        let result = await OTP.findOne({ otp: otp });

        console.log("Result is Generate OTP Func");
        console.log("OTP", otp);
        console.log("Result", result);

        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
            });
        }

        const otpPayload = { email, otp };

        //create an entry for otp in DB
        const otpBody = await OTP.create(otpPayload);

        console.log("OTP body-->", otpBody);

        //return response successfully
        res.status(200).json({
            success: true,
            message: 'OTP send Successfully',
            otp,
        })

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}


//SignUp Handler
exports.signUp = async (req, res) => {
    try {
        //fetch data from request body [Destructuring]]
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        //Validate the data
        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(403).json({
                success: false,
                message: 'All fields are required ',
            });
        }

        //Check password and confirmPassword matching
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password and confirmPassword does not matches, Try again',
            });
        }

        //check if user alread exist or not
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User is already registered',
            });
        }

        //find the most recent OTP stored in DB for user
        const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
        console.log("resent OTP --->", recentOtp);

        //Validate OTP
        if (recentOtp.length === 0) {
            //OTP not found
            return res.status(400).json({
                success: false,
                message: 'OTP not Found',
            });
        } else if (otp !== recentOtp[0].otp) {
            //Invalid otp
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP',
            });
        }

        //Hashing the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        let approved = "";
        approved === "Instructor" ? (approved = false) : (approved = true);

        //Create entry in DB
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        });

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            contactNumber,
            accountType: accountType,
            approved: approved,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}%20${lastName}`,
        })

        //return successful response
        return res.status(200).json({
            success: true,
            user,
            message: 'User registered Successfully',
        })

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'User cannot be registered, Please try again',
        })
    }
}

//Login Handler
exports.login = async (req, res) => {
    try {
        //fetch data from request body
        const { email, password } = req.body;

        //validation of data
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All field are required, Please try again',
            });
        }

        //check if user exist or not
        let user = await User.findOne({ email }).populate('additionalDetails');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User is not registered, Please signUp first ',
            });
        }

        //match the password and generate JWT token
        if (await bcrypt.compare(password, user.password)) {
            const payLoad = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }

            const token = jwt.sign(payLoad, process.env.JWT_SECRET, {
                expiresIn: '24h',
            })

            //Save token to user document in database
            user.token = token;
            user.password = undefined;

            //Set cookie for token and return success response
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            }

            res.cookie('token', token, options).status(200).json({
                success: true,
                token,
                user,
                message: 'User Logged in successfully',
            })
        }
        else {
            return res.status(401).json({
                success: false,
                message: 'Password is Incorrect',
            });
        }

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Login failure, Please try again ',
        });
    }
}


// Controller for Changing Password
exports.changePassword = async (req, res) => {
    try {
        // Get user data from req.user
        const userDetails = await User.findById(req.user.id);

        // Get old password, new password, and confirm new password from req.body
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        // Validate old password
        const isPasswordMatch = await bcrypt.compare(
            oldPassword,
            userDetails.password
        );
        if (!isPasswordMatch) {
            // If old password does not match, return a 401 (Unauthorized) error
            return res
                .status(401)
                .json({ success: false, message: "The password is incorrect" });
        }

        // Match new password and confirm new password
        if (newPassword !== confirmNewPassword) {
            // If new password and confirm new password do not match, return a 400 (Bad Request) error
            return res.status(400).json({
                success: false,
                message: "The password and confirm password does not match",
            });
        }

        // Update password
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            { password: encryptedPassword },
            { new: true }
        );

        // Send notification email
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            );
            console.log("Email sent successfully:", emailResponse.response);
        } catch (error) {
            // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
            console.error("Error occurred while sending email:", error);
            return res.status(500).json({
                success: false,
                message: "Error occurred while sending email",
                error: error.message,
            });
        }

        // Return success response
        return res
            .status(200)
            .json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while updating password:", error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while updating password",
            error: error.message,
        });
    }
};
