import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../server.js";

const router = express.Router();

// ─── Multer Storage Config ─────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/resume";

    // ✅ Folder na ho to automatically bana do
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // ✅ Unique filename: timestamp + original name
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  },
});

// ✅ Only PDF, DOC, DOCX allowed
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

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// ─── POST - Upload Resume File ─────────────────────────────
router.post("/", upload.single("resume"), async (req, res) => {
  try {
    const title = req.body?.title;

    if (!title) {
      return res.status(400).json({ success: false, error: "Title required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: "Resume file required" });
    }

    // ✅ File path jo DB mein store hogi
    const file_url = `uploads/resume/${req.file.filename}`;

    const result = await pool.query(
      "INSERT INTO resume (title, file_url) VALUES ($1, $2) RETURNING *",
      [title, file_url]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET - All Resumes ─────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM resume ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE - Resume + File bhi delete karo ───────────────
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // ✅ Pehle DB se file path lo
    const found = await pool.query("SELECT file_url FROM resume WHERE id = $1", [id]);

    if (found.rows.length > 0) {
      const filePath = found.rows[0].file_url;

      // ✅ Disk se file bhi delete karo
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.query("DELETE FROM resume WHERE id = $1", [id]);

    res.json({ success: true, message: "Deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;