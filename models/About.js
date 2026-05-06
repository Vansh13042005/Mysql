import mongoose from "mongoose";

const aboutSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: String,
  description: String,
  email: String,
  phone: String,
  experience: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("About", aboutSchema);