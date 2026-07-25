import * as nicknameService from "../services/nickname.service.js";

export const getNicknames = async (req, res) => {
  try {
    const nicknamesMap = await nicknameService.getUserNicknamesMap(
      req.user.id
    );

    return res.json(nicknamesMap);
  } catch (error) {
    console.error("Error fetching nicknames:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const saveNickname = async (req, res) => {
  const { upiId, nickname } = req.body;

  try {
    if (!upiId) {
      return res.status(400).json({
        message: "UPI ID is required",
      });
    }

    const updatedNickname =
      await nicknameService.upsertOrDeleteNickname(
        req.user.id,
        upiId,
        nickname
      );

    return res.json(updatedNickname);
  } catch (error) {
    console.error("Error saving nickname:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};