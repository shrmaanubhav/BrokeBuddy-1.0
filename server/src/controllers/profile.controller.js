import * as profileService from "../services/profile.service.js";

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await profileService.getUserProfile(userId);
    res.status(200).json(user);
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") return res.status(404).json({ msg: "User not found." });
    
    console.error("Get Profile Error:", error);
    res.status(500).json({ msg: "Server error fetching profile.", error: error.message });
  }
};

export const changeName = async (req, res) => {
  const { newName } = req.body;
  const userId = req.user._id;
  
  if (!newName || newName.trim() === "") {
    return res.status(400).json({ msg: "New name cannot be empty." });
  }
  
  try {
    const updatedName = await profileService.updateUserName(userId, newName);
    res.status(200).json({ msg: "Name updated successfully.", name: updatedName });
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") return res.status(404).json({ msg: "User not found." });
    
    console.error("Change Name Error:", error);
    res.status(500).json({ msg: "Server error updating name.", error: error.message });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ msg: "Please provide both current and new passwords." });
  }

  try {
    await profileService.updateUserPassword(userId, currentPassword, newPassword);
    res.status(200).json({ msg: "Password updated successfully." });
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") return res.status(404).json({ msg: "User not found." });
    if (error.message === "INCORRECT_PASSWORD") return res.status(400).json({ msg: "Incorrect current password." });
    
    console.error("Change Password Error:", error);
    res.status(500).json({ msg: "Server error updating password.", error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  const userId = req.user._id;
  const userEmail = req.user.email;

  try {
    await profileService.deleteUserAccount(userId, userEmail);
    res.status(200).json({ msg: "Account and associated data deleted successfully." });
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") return res.status(404).json({ msg: "User not found." });
    
    console.error("Delete Account Error:", error);
    res.status(500).json({ msg: "Server error deleting account.", error: error.message });
  }
};

export const updateUserData = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    await profileService.syncUserData(email);
    res.status(200).json({ message: "Synced and formatted successfully" });
  } catch (error) {
    console.error("Error updating user data:", error);
    res.status(500).json({ msg: "Error updating data", error: error.message });
  }
};