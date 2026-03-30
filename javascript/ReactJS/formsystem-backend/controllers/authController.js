const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../config/db');

//Email Transporter setup
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: `${process.env.EMAIL_USER}`,
        pass: `${process.env.EMAIL_PASSWORD}`
    }
});



//Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({
        id: userId
    },process.env.JWT_SECRET, {
        expiresIn:3600
    });
}

// @desc Register a new user
// @route POST /api/auth/register
// @access Public
exports.register = async (req, res) => {
    try{

        
        const { name, email, phone, password } = req.body;

        if(!name || !email || !password){
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email and password'
            });
        }

        const [exsistingUser] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if(exsistingUser.length > 0){
            return res.status(400).json({
                success: false,
                message: 'User with Email Already Exists'
            });
        }

        //Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
            [name, email, phone, hashedPassword]
        );

        const token = generateToken(result.insertId);

        res.status(201).json({
            success: true,
            message: 'User Registered Successfully',
            data:{
                id: result.insertId,
                name,
                email,
                phone,
                token
            }
        });
    }catch(err){
        console.error('Error during Registration:', err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

// @desc Login User
// @route POST /api/auth/login
// @access Public
exports.login = async (req, res) => {
    try{
        const { email, password } = req.body;

        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if(users.length === 0){
            return res.status(401).json({
                success: false,
                message: 'Invalid Credentials'
            });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(401).json({
                success: false,
                message: 'Invalid Credentials'
            });
        }

        const token = generateToken(user.id);

        res.status(200).json({
            success: true,
            message: 'Login Successful',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                token
            }
        });
    }catch(error){
        console.error('Error during Login:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

//@desc Forgot  Password
//@route POST /api/auth/forgot-password
//@access Public
exports.forgotPassword = async (req, res) => {
    try{
        console.log(req.body)
        const { email } = req.body;

        if(!email){
            return res.status(400).json({
                success: false,
                message: 'Please provide email'
            });
        }
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if(users.length === 0){
            return res.status(404).json({
                success: false,
                message: 'User with this email does not exist'
            });
        }

        const user = users[0];
        const resetToken = crypto.randomBytes(20).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        
        await db.query(
            'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
            [hashedToken, tokenExpiry, user.id]
        );

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

         const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: 'Password Reset Request',
            html:`
                <h2>Password Reset Request</h2>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, Please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: 'Password reset email sent to your email.'
        });


    }catch(error){
        console.error('Error during Forgot Password:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

// @desc Reset Password
// @route POST /api/auth/reset-password
// @access Public
exports.resetPassword = async (req, res) => {
    try{
        const { token, newPassword } = req.body;

        if(!token || !newPassword){
            return res.status(400).json({
                success: false,
                message: 'Please provide token and new password'
            });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const [users] = await db.query(
        'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?',
        [hashedToken, Date.now()]
        );

        if(users.length === 0){
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired token'
        });
        }

        const user = users[0];

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );
        
        res.json({
            success: true,
            message: 'Password reset successful'
        });
    }catch(error){
        console.error('Error during Reset Password:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

// @desc GET current user
// @route GET /api/auth/me 
// @access Private
exports.getMe = async (req, res) => {
    try{
        const [users] = await db.query(
            'SELECT id, name, email, phone,created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if(users.length === 0){
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: users[0]
        });
    }catch(error){
        console.error('Error fetching user data:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}