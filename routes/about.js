import express from "express";
import auth from "../middleware/auth.js";
import { pool } from "../server.js";

const router = express.Router();

// ✅ GET
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM about LIMIT 1");

    res.json({
      success: true,
      data: result.rows[0] || null,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ CREATE / UPDATE
router.post("/", auth, async (req, res) => {
  try {
    const { name, position, description, email, phone, experience } = req.body;

    const existing = await pool.query("SELECT * FROM about LIMIT 1");

    let result;

    if (existing.rows.length > 0) {
      const id = existing.rows[0].id;

      await pool.query(
        `UPDATE about 
         SET name=$1, position=$2, description=$3, email=$4, phone=$5, experience=$6 
         WHERE id=$7`,
        [name, position, description, email, phone, experience, id]
      );

      const updated = await pool.query(
        "SELECT * FROM about WHERE id=$1",
        [id]
      );

      result = updated.rows[0];

    } else {
      const insert = await pool.query(
        `INSERT INTO about (name, position, description, email, phone, experience) 
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [name, position, description, email, phone, experience]
      );

      result = insert.rows[0];
    }

    res.json({ success: true, data: result });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;