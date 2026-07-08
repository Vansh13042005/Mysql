import { supabase } from "../config/supabase.js"; // ✅ named import

export const uploadResumeToSupabase = async (file) => {
  const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;

  const { data, error } = await supabase.storage
    .from("resume")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from("resume")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};