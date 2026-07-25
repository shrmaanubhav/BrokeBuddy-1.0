import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
  const token = req.cookies?.token || req.cookies?.jwt;
  if (!token)
    return res.status(401).json({ msg: "Unauthorized - No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ msg: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ msg: "Invalid or expired token" });
  }
};
