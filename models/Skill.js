import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  percentage: { type: Number, default: 0 },
  icon: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Skill", skillSchema);