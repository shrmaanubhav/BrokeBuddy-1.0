import mongoose from "mongoose";
import { Schema } from "mongoose";
const onlineTransactionSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  UPI_ID: { type: String, required: true },
  nickname:{type:Schema.Types.ObjectId,ref:"Nickname"},
  COST: { type: Number, required: true },
  DEBITED: { type: Boolean, required: true },
  date: { type: String, required: true },

});

export default mongoose.model("onlineTransaction", onlineTransactionSchema);