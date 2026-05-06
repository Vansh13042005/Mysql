import express from "express";
import auth from "../middleware/auth.js"; // admin ke liye
import { pool } from "../server.js";

const router = express.Router();

// ==============================
// ✅ GET ALL FEEDBACK (ADMIN)
// ==============================
router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM feedback ORDER BY created_at DESC"
    );

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// ✅ CREATE FEEDBACK (PUBLIC)
// ==============================
router.post("/add", async (req, res) => {
  try {
    const { name, email, rating } = req.body;

    // validation
    if (!name || !email || !rating) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "Rating must be between 1 to 5"
      });
    }

    const result = await pool.query(
      `INSERT INTO feedback (name, email, rating) 
       VALUES ($1,$2,$3) RETURNING *`,
      [name, email, rating]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    console.log("FEEDBACK ERROR 👉", error); // 🔥 debug
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// ✅ DELETE FEEDBACK (ADMIN)
// ==============================
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM feedback WHERE id=$1", [id]);

    res.json({
      success: true,
      message: "Feedback deleted",
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;