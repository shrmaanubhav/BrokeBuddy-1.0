import mongoose from "mongoose";

const NicknameSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true,
  },

  upiId: {
    type: String,
    required: true,
  },
  nickname: {
    type: String,
    required: true,
  },
});

NicknameSchema.index({ userEmail: 1, upiId: 1 }, { unique: true });

export default mongoose.model("Nickname", NicknameSchema);
