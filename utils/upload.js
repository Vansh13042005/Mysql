import supabase from "../config/supabase.js";
import fs from "fs";

export const uploadResumeToSupabase = async (file) => {
  const buffer = fs.readFileSync(file.path);

  const fileName = `${Date.now()}_${file.originalname}`;

  const { error } = await supabase.storage
    .from("resume")
    .upload(fileName, buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from("resume")
    .getPublicUrl(fileName);

  // local temp file delete
  fs.unlinkSync(file.path);

  return data.publicUrl;
};