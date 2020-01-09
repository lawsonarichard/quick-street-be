const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const Vendor = require('../models/Vendor');

// @desc      Register vendor
// @route     POST /api/v1/auth/register
// @access    Public
exports.register = asyncHandler(async (req, res, next) => {
  const { email, password, business_name, address } = req.body;

  // Create vendor
  const vendor = await Vendor.create({
    email,
    password,
    business_name,
    address
  });

  sendTokenResponse(vendor, 200, res);
});

// @desc      Login vendor
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for vendor
  const vendor = await Vendor.findOne({ email }).select('+password');

  if (!vendor) {
    return next(new ErrorResponse('Invalid email credentials', 401)); //change back to "invalid credential once fully tested"
  }

  // Check if password matches
  const isMatch = await vendor.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid password credentials', 401)); //change back to "invalid credential once fully tested"
  }

  sendTokenResponse(vendor, 200, res);
});

// @desc      Log vendor out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc      Get current logged in vendor
// @route     POST /api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const vendor = await Vendor.findById(req.vendor.id);

  res.status(200).json({
    success: true,
    data: vendor
  });
});

// @desc      Forgot password
// @route     POST /api/v1/auth/forgotpassword
// @access    Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const vendor = await Vendor.findOne({ email: req.body.email });

  if(!vendor) {
    return next(new ErrorResponse('There is no Vendor with that email', 404));
  }

  // Get reset token
  const resetToken = vendor.getResetPasswordToken();

  await vendor.save({ validateBeforeSave: false })

  console.log('reset token', resetToken);

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1.0/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you or (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`; //include the front end link here 


  try {
    await sendEmail({
      email: vendor.email,
      subject: 'Password reset token',
      message 
    });

    res.status(200).json({ success: true, data: 'Email sent' })
  } catch (err) {
    console.log(err);
    vendor.resetPasswordToken = undefined;
    vendor.resetPasswordExpire = undefined;

    await vendor.save({ validateBeforeSave: false })

    return next(new ErrorResponse('Email could not be sent', 500));
  }
  res.status(200).json({
    success: true,
    data: vendor
  });

});

// Get token from model, create cookie and send response
const sendTokenResponse = (vendor, statusCode, res) => {
  // Create token
  const token = vendor.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ), //expires in 30 days from this time
    httpOnly: true //only availbale on client side script
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      id: vendor.id,
      token
    });
};
