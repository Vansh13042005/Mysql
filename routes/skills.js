import express from "express";
import auth from "../middleware/auth.js";
import { pool } from "../server.js";

const router = express.Router();

// GET
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM skills ORDER BY created_at DESC"
    );

    res.json({ success: true, data: result.rows });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE
router.post("/", auth, async (req, res) => {
  try {
    const { name, category, percentage, icon } = req.body;

    const result = await pool.query(
      `INSERT INTO skills (name, category, percentage, icon)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, category, percentage, icon]
    );

    res.status(201).json({ success: true, data: result.rows[0] });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, percentage, icon } = req.body;

    const result = await pool.query(
      `UPDATE skills 
       SET name=$1, category=$2, percentage=$3, icon=$4 
       WHERE id=$5 RETURNING *`,
      [name, category, percentage, icon, id]
    );

    res.json({ success: true, data: result.rows[0] });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE
router.delete("/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM skills WHERE id=$1", [req.params.id]);

    res.json({ success: true, message: "Deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;