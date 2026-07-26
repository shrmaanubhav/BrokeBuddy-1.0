import * as profileService from "../services/profile.service.js";
import * as transactionSyncService from "../services/transaction-sync.service.js";

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await profileService.getUserProfile(userId);

    res.status(200).json(user);
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        msg: "User not found.",
      });
    }

    console.error("Get Profile Error:", error);

    res.status(500).json({
      msg: "Server error fetching profile.",
      error: error.message,
    });
  }
};

export const changeName = async (req, res) => {
  const { newName } = req.body;
  const userId = req.user.id;

  if (!newName || newName.trim() === "") {
    return res.status(400).json({
      msg: "New name cannot be empty.",
    });
  }

  try {
    const updatedName = await profileService.updateUserName(
      userId,
      newName
    );

    res.status(200).json({
      msg: "Name updated successfully.",
      name: updatedName,
    });
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        msg: "User not found.",
      });
    }

    console.error("Change Name Error:", error);

    res.status(500).json({
      msg: "Server error updating name.",
      error: error.message,
    });
  }
};

export const deleteAccount = async (req, res) => {
  const userId = req.user.id;

  try {
    await profileService.deleteUserAccount(userId);

    res.status(200).json({
      msg: "Account and associated data deleted successfully.",
    });
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        msg: "User not found.",
      });
    }

    console.error("Delete Account Error:", error);

    res.status(500).json({
      msg: "Server error deleting account.",
      error: error.message,
    });
  }
};

export const syncTransactions = async (req, res) => {
  try {
    const result = await transactionSyncService.syncUserData(req.user.id);

    return res.status(200).json({
      msg: "Transactions synced successfully.",
      ...result,
    });
  } catch (error) {
    console.error("Transaction sync error:", error);

    return res.status(500).json({
      msg: "Failed to sync transactions.",
      error: error.message,
    });
  }
};