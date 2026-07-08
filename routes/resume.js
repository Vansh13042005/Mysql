import express from "express";
import multer from "multer";
import { pool } from "../server.js";
import { uploadResumeToSupabase } from "../utils/uploadResumeToSupabase.js";
import { supabase } from "../config/supabase.js"; // ✅ named import, top pe

const router = express.Router();

// Only PDF, DOC, DOCX
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, DOCX files are allowed"), false);
  }
};

// Multer Memory Storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ==============================
// POST - Upload Resume
// ==============================
router.post("/", upload.single("resume"), async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: "Title is required" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Resume file is required" });
    }

    const file_url = await uploadResumeToSupabase(req.file);

    const result = await pool.query(
      `INSERT INTO resume(title, file_url) VALUES($1, $2) RETURNING *`,
      [title, file_url]
    );

    return res.status(201).json({
      success: true,
      message: "Resume uploaded successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================
// GET - All Resume
// ==============================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM resume ORDER BY id DESC");
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================
// DELETE Resume
// ==============================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const found = await pool.query("SELECT * FROM resume WHERE id=$1", [id]);

    if (found.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Resume not found" });
    }

    const resume = found.rows[0];

    // Delete from Supabase Storage
    if (resume.file_url) {
      const fileName = resume.file_url.split("/").pop();
      const { error } = await supabase.storage.from("resume").remove([fileName]);
      if (error) console.log("Supabase Delete Error:", error.message);
    }

    // Delete from Database
    await pool.query("DELETE FROM resume WHERE id=$1", [id]);

    return res.json({ success: true, message: "Resume deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;