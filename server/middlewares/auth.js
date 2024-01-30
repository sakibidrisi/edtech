const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

//Auth middleware
exports.auth = async (req,res,next) => {
    try{
        //extract token from request
        const token = req.cookies.token 
                    || req.body.token
                    || req.header('Authorisation').replace('Bearer', "");

        //if token is missing
        if(!token){
            return res.status(401).json({
                success: false,
                message: 'Token is missing',
            });
        }

        //verify the token
        try{
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decode);
            req.user = decode;
        }
        catch(err){
            //verification issue
            return res.status(401).json({
                success: false,
                message: 'Token is invalid',
            });
        }
        next();

    }
    catch(error){
        console.log(error);
        return res.status(401).json({
            success: false,
            message: 'Something went wrong while validating the token',
        });
    }
}

//isStudent middleware
exports.isStudent = async (req,res,next) => {
    try{
        if(req.user.accountType !== 'Student'){
            return res.status(401).json({
                success: false,
                message: 'This is protected route for students',
            });
        }
        next();

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'User role cannot be verified, Please try again',
        });
    }
}

//isInstructor middleware
exports.isInstructor = async (req,res,next) => {
    try{
        if(req.user.accountType !== 'Instructor'){
            return res.status(401).json({
                success: false,
                message: 'This is protected route for Instructor',
            });
        }
        next();

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'User role cannot be verified, Please try again',
        });
    }
}

//isAdmin middleware
exports.isAdmin = async (req,res,next) => {
    try{
        if(req.user.accountType !== 'Admin'){
            return res.status(401).json({
                success: false,
                message: 'This is protected route for Admin',
            });
        }
        next();

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'User role cannot be verified, Please try again',
        });
    }
}