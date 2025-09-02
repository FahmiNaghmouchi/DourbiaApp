const express = require('express');
const {
    userById,
    allUsers,
    getUser,
    updateUser,
    deleteUser,
    hasAuthorization,
    getLeaderboard,
    getUserScore 
} = require('../controllers/user');
const { requireSignin } = require('../controllers/auth');

const router = express.Router();

router.get('/secret/:userId', requireSignin, (req, res) => {
    res.json({
        user: req.profile
    });
});

// router.get('/hello', requireSignin, (req, res) => {
//     res.send('Hello');
// });

router.get('/leaderboard', getLeaderboard);
router.get('/users', allUsers);
router.get('/user/:userId', requireSignin, getUser);
router.put('/user/:userId', requireSignin, hasAuthorization, updateUser);
router.delete('/user/:userId', requireSignin, hasAuthorization, deleteUser);
router.get('/score/:userId', requireSignin,hasAuthorization, getUserScore);



router.param('userId', userById);

module.exports = router;
