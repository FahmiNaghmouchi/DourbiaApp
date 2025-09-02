const jwt = require('jsonwebtoken');
require('dotenv').config();
const expressJwt = require('express-jwt');
const User = require('../models/user');
const _ = require('lodash');
const { OAuth2Client } = require('google-auth-library');
const { sendEmail } = require('../helpers');

// exports.signup = async (req, res) => {
//     const userExists = await User.findOne({ email: req.body.email });
//     if (userExists)
//         return res.status(403).json({
//             error: 'Email is taken!'
//         });
//     const user = await new User(req.body);
//     await user.save();
//     res.status(200).json({ message: 'Signup success! Please login.' });
// };

exports.signup = (req, res) => {
    const user = new User(req.body);
    console.log( user);
    user.save((err, user) => {
        if (err) {
            return res.status(400).json({
                err: errorHandler(err)
            });
        }
        user.salt = undefined;
        user.hashed_password = undefined;
        res.json({
            user
        });
    });
};



exports.signin = (req, res) => {
    const { email, password } = req.body;
    console.log('req.body', req.body);
    User.findOne({ email }, (err, user) => {r
        if (err || !user) {
            return res.status(401).json({
                error: 'User with that email does not exist. Please signup.'
            });
        }
       
        if (!user.authenticate(password)) {
            return res.status(401).json({
                error: 'Email and password do not match'
            });
        }
        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET);
        res.cookie('t', token, { expire: new Date() + 9999 });
        const { _id, name, email, role } = user;
        return res.json({ token, user: { _id, email, name, role } });
    });
};

exports.signout = (req, res) => {
    res.clearCookie('t');
    return res.json({ message: 'Signout success!' });
};

exports.requireSignin = expressJwt({
    secret: process.env.JWT_SECRET,
    userProperty: 'auth'
});

const randomString=(len = 10, charStr = 'abcdefghijklmnopqrstuvwxyz0123456789') =>{
    const chars = [...`${charStr}`];
    return [...Array(len)].map((i) => chars[(Math.random() * chars.length) | 0]).join('');
  }
exports.forgotPassword = (req, res) => {
    if (!req.body) return res.status(400).json({ message: 'No request body' });
    if (!req.body.email) return res.status(400).json({ message: 'No Email in request body' });
    const { email } = req.body;
    console.log('signin req.body', email);
    User.findOne({ email }, async (err, user) => {
      
        if (err || !user)
            return res.status('401').json({
                error: 'User with that email does not exist!'
            });
        const tempPass = randomString(10, 'abcdefghijklmnopqrstuvwxyz0123456789');
        user.password = tempPass;
        await user.save();
        const emailData = {
            from: 'noreply@node-react.com',
            to: email,
            subject: 'Password Reset Instructions',
            text: `This is your New Password ${tempPass}`,
            html: `<p>This is your New Password</p> <p>${tempPass}</p>`
        };

        return user.updateOne({ password: tempPass }, (err, success) => {
            if (err) {
                return res.json({ message: err });
            } else {
                sendEmail(emailData);
                return res.status(200).json({
                    message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
                });
            }
        });
    });
};

// to allow user to reset password
// first you will find the user in the database with user's resetPasswordLink
// user model's resetPasswordLink's value must match the token
// if the user's resetPasswordLink(token) matches the incoming req.body.resetPasswordLink(token)
// then we got the right user

exports.resetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;

    User.findOne({ resetPasswordLink }, (err, user) => {
        // if err or no user
        if (err || !user)
            return res.status('401').json({
                error: 'Invalid Link!'
            });

        const updatedFields = {
            password: newPassword,
            resetPasswordLink: ''
        };

        user = _.extend(user, updatedFields);
        user.updated = Date.now();

        user.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json({
                message: `Great! Now you can login with your new password.`
            });
        });
    });
};

const client = new OAuth2Client(process.env.REACT_APP_GOOGLE_CLIENT_ID);




