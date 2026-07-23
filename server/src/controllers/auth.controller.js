import * as authService from "../services/auth.service.js";

export const signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    await authService.signupUser(email, password);
    res.status(201).json({ msg: "User created successfully" });
  } catch (err) {
    if (err.message === "EMAIL_NOT_VERIFIED") return res.status(400).json({ msg: "Email not verified" });
    if (err.message === "USER_ALREADY_EXISTS") return res.status(400).json({ msg: "User already exists" });
    
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { user, token } = await authService.loginUser(email, password);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    if (err.message === "INVALID_USERNAME") return res.status(400).json({ msg: "Invalid Username" });
    if (err.message === "INVALID_PASSWORD") return res.status(400).json({ msg: "Invalid Password" });
    
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

export const logout = (req, res) => {
  // Logout has no business logic, so it doesn't need a service call
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.json({ msg: "Logged out successfully" });
};

export const sendOTP = async (req, res) => {
  const { name, email } = req.body;
  try {
    await authService.generateAndSendOTP(name, email);
    res.json({ msg: "OTP sent successfully" });
  } catch (err) {
    if (err.message === "INVALID_EMAIL") return res.status(400).json({ msg: "Invalid email" });
    
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

export const verifyOTP = async (req, res) => {
  const { email, OTP } = req.body;
  try {
    await authService.verifyUserOTP(email, OTP);
    res.json({ msg: "OTP verified" });
  } catch (err) {
    if (err.message === "EMAIL_NOT_FOUND") return res.status(400).json({ msg: "Email Not found" });
    if (err.message === "OTP_EXPIRED") return res.status(400).json({ msg: "OTP expired" });
    if (err.message === "INVALID_OTP") return res.status(400).json({ msg: "Invalid OTP" });
    
    console.error("SERVER ERROR:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

export const resetPass = async (req, res) => {
  const { email, newPass } = req.body;
  try {
    await authService.resetUserPassword(email, newPass);
    return res.json({ msg: "Password reset successful" });
  } catch (err) {
    if (err.message === "INVALID_OTP_VERIFICATION") return res.status(400).json("Invalid OTP");
    if (err.message === "USER_NOT_FOUND") return res.status(400).json("User not found");
    
    console.error("Reset password error:", err);
    return res.status(500).json({ msg: "Failed to reset password", error: err.message });
  }
};