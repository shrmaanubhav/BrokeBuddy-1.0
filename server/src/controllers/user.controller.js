import * as userService from "../services/user.service.js";

export const getBankSenderEmail = async (req, res) => {
  try {
    const user = await userService.getUserBankSenderEmail(req.user.id);

    return res.status(200).json(user);
  } catch (error) {
    console.error("Get bank sender email error:", error);

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ msg: "User not found." });
    }

    return res.status(500).json({ msg: "Server error.", error: error.message });
  }
};

export const updateBankSenderEmail = async (req, res) => {
  const { bankSenderEmail } = req.body;

  if (!bankSenderEmail || bankSenderEmail.trim() === "") {
    return res.status(400).json({ msg: "Bank sender email is required." });
  }

  try {
    const updatedUser = await userService.updateUserBankSenderEmail(
      req.user.id,
      bankSenderEmail.trim()
    );

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Update bank sender email error:", error);

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ msg: "User not found." });
    }

    return res.status(500).json({ msg: "Server error.", error: error.message });
  }
};

export const verifyBankSenderEmail = async (req, res) => {
  try {
    const bankSenderVerified = await userService.verifyUserBankSenderEmail(
      req.user.id
    );

    return res.status(200).json({ bankSenderVerified });
  } catch (error) {
    console.error("Verify bank sender email error:", error);

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ msg: "User not found." });
    }

    return res.status(500).json({ msg: "Server error.", error: error.message });
  }
};
