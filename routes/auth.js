const router = require('express').Router();
const passport = require('passport');
const bcrypt = require("bcrypt");
const { body, validationResult } = require('express-validator');
const User = require('../models/User');


router.get("/login/success", (req, res) => {
    if(req.user) {
        res.status(200).json({
            success: true,
            message: "successfull",
            user: req.user,
        });
    }
});

router.get("/login/failed", (req, res) => {
    res.status(401).json({
        success: false,
        message: "failure",
    });
    res.redirect("http://localhost:5173");
});

router.get("/logout", (req, res) =>{
    req.logout();
    res.redirect("http://localhost:5173");
})

router.get('/google',
  passport.authenticate('google', { 
    scope: ['email', 'profile']
    })
);

router.get('/google/callback', 
  passport.authenticate('google', {
    successRedirect: 'http://localhost:5173', 
    failureRedirect: '/login/failed' 
}));

router.post("/register", [
    // Validation rules
    body('username', 'Username is required').notEmpty().escape(),
    body('password', 'Password is required').notEmpty().escape(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    // More validation rules can be added as needed
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If there are validation errors, return them as response
      return res.status(400).json({ errors: errors.array() });
    }

    let { username, password} = req.body;

    console.log({
      username,
      password
    });

    if (!username || !password) {
        return res.status(400).json({message: "Please enter all fields"});
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists." });
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            username: username,
            hashedPassword: hashedPassword
        });

        // Save the user in the database
        const savedUser = await newUser.save();

        // Successful registration
        res.status(201).json({ user: savedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;