import express from "express";
import auth from "../middleware/auth.js";
import { pool } from "../server.js";

const router = express.Router();

// ✅ GET ALL
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM messages ORDER BY created_at DESC"
    );

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ CREATE (PUBLIC hona chahiye)
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const result = await pool.query(
      `INSERT INTO messages (name, email, message) 
       VALUES ($1,$2,$3) RETURNING *`,
      [name, email, message]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ MARK AS READ
router.put("/:id/read", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE messages SET is_read=true WHERE id=$1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ DELETE
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM messages WHERE id=$1", [id]);

    res.json({
      success: true,
      message: "Deleted",
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;