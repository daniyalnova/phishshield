import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import validator from "validator";

// Requires: 8+ chars, at least one uppercase, one lowercase, one digit,
// and one special character. Rejects the most commonly leaked passwords
// outright via validator's isStrongPassword rather than a hand-rolled regex.
function isPasswordStrong(password) {
  return validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  });
}

// @route POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    if (!isPasswordStrong(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({ name, email: email.toLowerCase(), password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// @route POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +loginAttempts +lockUntil"
    );

    // Same generic message whether the account doesn't exist or the
    // password is wrong — don't leak which one it was.
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isLocked) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        message: `Too many failed login attempts. Try again in ${minutesLeft} minute(s).`,
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await user.registerFailedLogin();
      const attemptsLeft = Math.max(0, 5 - user.loginAttempts);
      return res.status(401).json({
        message:
          attemptsLeft > 0
            ? `Invalid email or password. ${attemptsLeft} attempt(s) remaining before temporary lockout.`
            : "Invalid email or password. Account temporarily locked due to repeated failures.",
      });
    }

    await user.registerSuccessfulLogin();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// @route GET /api/auth/me
export const getMe = async (req, res) => {
  res.json(req.user);
};
