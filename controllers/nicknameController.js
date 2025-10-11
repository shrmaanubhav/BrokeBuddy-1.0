import Nickname from "../models/Nickname.js";

export const getNicknames = async (req, res) => {
  try {
    const { email } = req.body;
    const nicknamesArray = await Nickname.find({ userEmail: email });

    const nicknamesMap = nicknamesArray.reduce((acc, item) => {
      acc[item.upiId] = item.nickname;
      return acc;
    }, {});

    res.json(nicknamesMap);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const saveNickname = async (req, res) => {
  const { email, upiId, nickname } = req.body;

  try {
    if (!nickname || nickname.trim() === "") {
      await Nickname.findOneAndDelete({ userEmail: email, upiId: upiId });
      return res.json({ message: "Nickname deleted" });
    }

    const updatedNickname = await Nickname.findOneAndUpdate(
      { userEmail: email, upiId: upiId },
      { nickname: nickname },
      { new: true, upsert: true }
    );

    res.json(updatedNickname);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
