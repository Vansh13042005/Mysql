import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import auth from "../middleware/auth.js";
import { pool } from "../server.js";

const router = express.Router();

// ─────────────────────────────────────────────
// ✅ MULTER SETUP
// ─────────────────────────────────────────────

const UPLOAD_DIR = "uploads/projects";

// Create folder if not exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    cb(null, `project_${Date.now()}${ext}`);
  },
});

// File validation
const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only JPEG, PNG, WEBP images are allowed"),
      false
    );
  }
};

// Multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// ─────────────────────────────────────────────
// ✅ DELETE OLD IMAGE
// ─────────────────────────────────────────────

const deleteImage = (imageUrl) => {
  try {
    if (!imageUrl) return;

    const urlPath = new URL(imageUrl).pathname;

    const filepath = urlPath.replace(/^\//, "");

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch {
    if (fs.existsSync(imageUrl)) {
      fs.unlinkSync(imageUrl);
    }
  }
};

// ─────────────────────────────────────────────
// ✅ GET ALL PROJECTS
// ─────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects ORDER BY created_at DESC"
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// ✅ CREATE PROJECT
// ─────────────────────────────────────────────

router.post(
  "/",
  auth,
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        tech,
        link,
        github,
      } = req.body;

      let imageUrl = null;

      // Build image URL
      if (req.file) {
        const protocol = req.protocol;
        const host = req.get("host");

        imageUrl = `${protocol}://${host}/uploads/projects/${req.file.filename}`;
      }

      const result = await pool.query(
        `
        INSERT INTO projects
        (
          title,
          description,
          category,
          tech,
          link,
          github,
          image
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *
        `,
        [
          title,
          description,
          category,
          tech,
          link,
          github,
          imageUrl,
        ]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  }
);

// ─────────────────────────────────────────────
// ✅ UPDATE PROJECT
// ─────────────────────────────────────────────

router.put(
  "/:id",
  auth,
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        title,
        description,
        category,
        tech,
        link,
        github,
      } = req.body;

      // Get old image
      const existing = await pool.query(
        "SELECT image FROM projects WHERE id=$1",
        [id]
      );

      let imageUrl = existing.rows[0]?.image || null;

      // Upload new image
      if (req.file) {
        // Delete old image
        if (imageUrl) {
          deleteImage(imageUrl);
        }

        const protocol = req.protocol;
        const host = req.get("host");

        imageUrl = `${protocol}://${host}/uploads/projects/${req.file.filename}`;
      }

      const result = await pool.query(
        `
        UPDATE projects
        SET
          title=$1,
          description=$2,
          category=$3,
          tech=$4,
          link=$5,
          github=$6,
          image=$7
        WHERE id=$8
        RETURNING *
        `,
        [
          title,
          description,
          category,
          tech,
          link,
          github,
          imageUrl,
          id,
        ]
      );

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  }
);

// ─────────────────────────────────────────────
// ✅ DELETE PROJECT
// ─────────────────────────────────────────────

router.delete("/:id", auth, async (req, res) => {
  try {
    const existing = await pool.query(
      "SELECT image FROM projects WHERE id=$1",
      [req.params.id]
    );

    // Delete image
    if (existing.rows[0]?.image) {
      deleteImage(existing.rows[0].image);
    }

    // Delete project
    await pool.query(
      "DELETE FROM projects WHERE id=$1",
      [req.params.id]
    );

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;