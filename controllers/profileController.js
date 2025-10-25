import User from "../models/User.js";
import Nickname from "../models/Nickname.js";
import manualTransaction from "../models/manualTransaction.js";
import bcrypt from "bcrypt";

export const changeUsername = async (req, res) => {
  const { email, newUsername } = req.body;
  const userId = req.user._id;

  if (!newUsername || newUsername.trim() === "") {
    return res.status(400).json({ msg: "New username cannot be empty." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    user.username = newUsername.trim();
    await user.save();

    res
      .status(200)
      .json({ msg: "Username updated successfully.", username: user.username });
  } catch (error) {
    console.error("Change Username Error:", error);
    res
      .status(500)
      .json({ msg: "Server error updating username.", error: error.message });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ msg: "Please provide both current and new passwords." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect current password." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ msg: "Password updated successfully." });
  } catch (error) {
    console.error("Change Password Error:", error);
    res
      .status(500)
      .json({ msg: "Server error updating password.", error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  const userId = req.user._id;
  const userEmail = req.user.email;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ msg: "User not found." });
    }

    await Nickname.deleteMany({ userEmail: userEmail });
    await manualTransaction.deleteMany({ userEmail: userEmail });

    res
      .status(200)
      .json({ msg: "Account and associated data deleted successfully." });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res
      .status(500)
      .json({ msg: "Server error deleting account.", error: error.message });
  }
};
