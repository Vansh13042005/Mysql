import supabase from "../config/supabase.js";
import fs from "fs";

export const uploadToSupabase = async (file) => {

  const fileBuffer = fs.readFileSync(file.path);

  const fileName =
    Date.now() + "_" + file.originalname;

  const { data, error } =
    await supabase.storage
      .from("projects")
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
      });

  if (error) {
    throw error;
  }

  const { data: publicUrl } =
    supabase.storage
      .from("projects")
      .getPublicUrl(fileName);

  return publicUrl.publicUrl;
};