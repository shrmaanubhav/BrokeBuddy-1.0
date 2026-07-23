import mongoose from "mongoose";

const tempUserSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  verified: { type: Boolean, default: false },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 5 * 60 * 1000,
    index: { expires: 0 },
  },
});

export default mongoose.model("tempUser", tempUserSchema);
