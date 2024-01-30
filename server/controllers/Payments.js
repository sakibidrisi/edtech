const { instance } = require('../config/razorpay');
const Course = require('../models/Course');
const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const { courseEnrollmentEmail } = require('../mail/templates/courseEnrollmentEmail');
const { default: mongoose } = require('mongoose');


//capture the payment and initiate the Razorpay order
exports.capturePayment = async (req, res) => {

    //get courseId and userId
    const { course_id } = req.body;
    const userId = req.user.id;

    //validation of courseId
    if (!course_id) {
        return res.json({
            success: false,
            message: 'Provide valid courseId',
        });
    }

    //validate courseDetails
    let course;
    try {
        course = await Course.findById(course_id);
        if (!course) {
            return res.json({
                success: false,
                message: 'Could not find the course',
            });
        }

        //user already payed for the same course
        const uid = new mongoose.Types.ObjectId(userId);
        if (course.studentsEnrolled.includes(uid)) {
            return res.status(400).json({
                success: false,
                message: 'Student is already enrolled',
            });
        }

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }

    //create order
    const amount = course.price;
    const currency = 'INR';

    const options = {
        amount: amount * 100,
        currency,
        receipt: Math.random(Date.now()).toString(),
        notes: {
            courseId: course_id,
            userId,
        }
    }

    try {
        //initiate the payment using Razorpay
        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse);

        return res.status(200).json({
            success: true,
            courseName: course.courseName,
            courseDescription: course.courseDescription,
            thumnail: course.thumbnail,
            orderId: paymentResponse.id,
            currency: paymentResponse.currency,
            amount: paymentResponse.amount,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'could not initiate order',
        });
    }
}

//Signature verification of razorpay and server
exports.verifySignature = async (req, res) => {

    const webhookSecret = '122345678';

    const signature = req.headers["x-razorpay-signature"];

    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (signature === digest) {
        console.log('Payment id Authorised');

        const { courseId, userId } = req.body.payload.payment.entity.notes;

        try { //fulfil the Actions

            //find the course and enroll the student in it
            const enrolledCourse = await Course.findByIdAndUpdate({ courseId },
                {
                    $push: {
                        studentsEnrolled: userId,
                    }
                },
                { new: true });

            if (!enrolledCourse) {
                return res.status(500).json({
                    success: false,
                    message: 'Course not found',
                });
            }

            console.log(enrolledCourse);

            //find the student and add the course to their enrolledCourses list
            const enrolledStudent = await User.findByIdAndUpdate({ userId },
                {
                    $push: {
                        courses: courseId,
                    }
                },
                { new: true });

            console.log(enrolledStudent);

            //Send confirmation Email
            const emailResponse = await mailSender(enrolledStudent.email, 'Congratulations', 'You have registered to new Course');

            console.log(emailResponse);

            //send success response
            return res.status(200).json({
                success: true,
                message: 'Signature verified and Course added',
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
    else{
        return res.status(400).json({
            success: false,
            message: 'Signature does not verified, Invalid request',
        });
    }

}