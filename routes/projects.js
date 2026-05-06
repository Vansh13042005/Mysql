import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import auth from "../middleware/auth.js";
import { pool } from "../server.js";
import { uploadToSupabase } from "../utils/upload.js";

const router = express.Router();

// ================= MULTER SETUP =================
const UPLOAD_DIR = "uploads/projects";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `project_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// ================= GET =================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects ORDER BY created_at DESC"
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("GET ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= CREATE =================
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    console.log("FILE RECEIVED:", req.file);

    const { title, description, category, tech, link, github } = req.body;

    let imageUrl = null;

    if (req.file) {
      imageUrl = await uploadToSupabase(req.file);

      console.log("FINAL IMAGE URL:", imageUrl); // ✅ DEBUG

      // delete temp file safely
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    const result = await pool.query(
      `INSERT INTO projects (title, description, category, tech, link, github, image)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, description, category, tech, link, github, imageUrl]
    );

    res.status(201).json({ success: true, data: result.rows[0] });

  } catch (error) {
    console.error("CREATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= UPDATE =================
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, tech, link, github } = req.body;

    const existing = await pool.query(
      "SELECT image FROM projects WHERE id=$1",
      [id]
    );

    let imageUrl = existing.rows[0]?.image || null;

    if (req.file) {
      imageUrl = await uploadToSupabase(req.file);

      console.log("UPDATED IMAGE URL:", imageUrl); // ✅ DEBUG

      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    const result = await pool.query(
      `UPDATE projects
       SET title=$1, description=$2, category=$3, tech=$4, link=$5, github=$6, image=$7
       WHERE id=$8 RETURNING *`,
      [title, description, category, tech, link, github, imageUrl, id]
    );

    res.json({ success: true, data: result.rows[0] });

  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= DELETE =================
router.delete("/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM projects WHERE id=$1", [req.params.id]);

    res.json({ success: true, message: "Deleted" });

  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;