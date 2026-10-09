const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
    };
}

async function register(req, res, next) {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email, password: hashedPassword });

        return res.status(201).json({
            message: "Account registered successfully.",
            user: publicUser(user)
        });
    } catch (error) {
        return next(error);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select("+password");
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                error: { message: "Invalid email or password." }
            });
        }

        const token = jwt.sign(
            { sub: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            message: "Login successful.",
            token,
            expiresIn: "1h",
            user: publicUser(user)
        });
    } catch (error) {
        return next(error);
    }
}

async function getMe(req, res, next) {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({
                error: { message: "The account for this token no longer exists." }
            });
        }
        return res.status(200).json({ user: publicUser(user) });
    } catch (error) {
        return next(error);
    }
}

module.exports = { register, login, getMe };
