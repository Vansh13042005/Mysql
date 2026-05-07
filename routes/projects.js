import express from "express";
import multer from "multer";
import { pool } from "../server.js";
import auth from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ===============================
// GET PROJECTS
// ===============================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects ORDER BY created_at DESC"
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// CREATE PROJECT
// ===============================

router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, tech, link, github } = req.body;
    let imageUrl = null;

    if (req.file) {
      const fileName = `project_${Date.now()}_${req.file.originalname}`;

      const { error } = await supabase.storage
        .from("projects")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (error) {
        console.log("SUPABASE ERROR:", error);
        return res.status(500).json({ error: error.message });
      }

      const { data } = supabase.storage
        .from("projects")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const result = await pool.query(
      `INSERT INTO projects (title, description, category, tech, link, github, image)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, description, category, tech, link, github, imageUrl]
    );

    res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.log("PROJECT CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// DELETE PROJECT
// ===============================

router.delete("/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM projects WHERE id=$1", [req.params.id]);
    res.json({ success: true, message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;