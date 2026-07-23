import mongoose from "mongoose";

const manualTransactionSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  UPI_ID: { type: String, required: true },
  COST: { type: Number, required: true },
  DEBITED: { type: Boolean, required: true },
  date: { type: Date, required: true },
});

export default mongoose.model("manualTransaction", manualTransactionSchema);
