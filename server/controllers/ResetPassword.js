const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

//resetPasswordToken Handler
exports.resetPasswordToken = async (req, res) => {
    try {

        //fetch email from request body
        const email = req.body.email;

        //email validation from DB
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.json({
                success: false,
                message: `This Email: ${email} is not Registered With Us Enter a Valid Email`,
            });
        }

        //Generate token
        const token = crypto.randomBytes(20).toString("hex");

        //Update user by adding token and expiry time
        const updatedDetails = await User.findOneAndUpdate(
            { email: email },
            {
                token: token,
                resetPasswordExpires: Date.now() + 3600000,
            },
            { new: true });

        console.log("DETAILS", updatedDetails);

        //Creat URL
        const url = `http://localhost:3000/update-password/${token}`;

        //send email containig the link
        await mailSender(email, `Password reset`,
        `Your Link for email verification is ${url}. Please click this url to reset your password.`);

        //return response
        return res.json({
            success: true,
            message: 'Email send successfully, Please reset the password',
        });

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while sending reset password link',
        });
    }
}

//rest password handler
exports.resetPassword = async (req, res) => {
    try {

        //fetch data from req body
        const { token, password, confirmPassword } = req.body;

        //validation
        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: 'Password and ConfirmPassword does not match',
            });
        }

        //get user details from DB using token
        const userDetails = await User.findOne({ token: token });

        //if not found or invalid token
        if (!userDetails) {
            return res.json({
                success: false,
                message: 'Token is in valid',
            });
        }

        //Token time limit checking
        if (!(userDetails.resetPasswordExpires > Date.now())) {
            return res.status(403).json({
                success: false,
                message: 'Token is expired, Please re-generate it',
            });
        }

        //hash password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        //password update in DB
        await User.findOneAndUpdate(
            { token: token },
            { password: hashedPassword },
            { new: true },
        );

        return res.json({
            success: true,
            message: 'Password updated successfully',
        })

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while resetting the password',
        });
    }
}