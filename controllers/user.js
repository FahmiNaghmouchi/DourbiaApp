const _ = require('lodash');
const User = require('../models/user');
const formidable = require('formidable');
const fs = require('fs');

exports.userById = (req, res, next, id) => {
    User.findById(id)
        .exec((err, user) => {
            if (err || !user) {
                return res.status(400).json({
                    error: 'User not found'
                });
            }
            req.profile = user; // adds profile object in req with user info
            next();
        });
};

exports.hasAuthorization = (req, res, next) => {
    let sameUser = req.profile && req.auth && req.profile._id == req.auth._id;
    let adminUser = req.profile && req.auth && req.auth.role === 'admin';

    const authorized = sameUser || adminUser;

    // console.log("req.profile ", req.profile, " req.auth ", req.auth);
    // console.log("SAMEUSER", sameUser, "ADMINUSER", adminUser);

    if (!authorized) {
        return res.status(403).json({
            error: 'User is not authorized to perform this action'
        });
    }
    next();
};

exports.allUsers = (req, res) => {
    User.find((err, users) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
        res.json(users);
    }).select('name email updated created role');
};

exports.getUser = (req, res) => {
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;
    return res.json(req.profile);
};

exports.updateUser = (req, res) => {
    const { name, score } = req.body;
    if ((name && score) || (!name && !score)) {
        return res.status(400).json({
            error: "You can only update either the username or the score, not both."
        });
    }
    User.findById(req.profile._id, (err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: "User not found",
            });
        }
        if (name) {
            user.name = name;
        }
        if (score) {
            if (isNaN(score)) {
                return res.status(400).json({
                    error: "Score must be a number",
                });
            }
            user.score = score;
        }
        user.updated = Date.now();
        user.save((err, updatedUser) => {
            if (err) {
                return res.status(400).json({
                    error: "Failed to update user",
                });
            }
            updatedUser.hashed_password = undefined;
            updatedUser.salt = undefined;
            res.json(updatedUser);
        });
    });
};

exports.getLeaderboard = (req, res) => {
    User.find({})
        .sort({ score: -1 })
        .limit(10) 
        .exec((err, users) => {
            if (err) {
                return res.status(400).json({
                    error: "Failed to retrieve leaderboard",
                });
            }
            users = users.map(user => {
                user.hashed_password = undefined;
                user.salt = undefined;
                return user;
            });
            res.json(users);
        });
};


/*
exports.updateUser = (req, res, next) => {
    let form = new formidable.IncomingForm();
    // console.log("incoming form data: ", form);
    form.keepExtensions = true;
        // save user
        // console.log("user in update: ", user);
        user = _.extend(user, fields);

        user.updated = Date.now();
        // console.log("USER FORM DATA UPDATE: ", user);
       
        user.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            user.hashed_password = undefined;
            user.salt = undefined;
            // console.log("user after update with formdata: ", user);
            res.json(user);
        });
    };
*/



exports.deleteUser = (req, res, next) => {
    let user = req.profile;
    user.remove((err, user) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
        res.json({ message: 'User deleted successfully' });
    });
};


exports.getUserScore = (req, res) => {
    User.findById(req.profile._id, (err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: "User not found",
            });
        }

        res.json({
            score: user.score,
        });
    });
};









  


