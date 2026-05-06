import express from "express";
import { pool } from "../server.js";

const router = express.Router();

// ✅ GET EDUCATION
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM education ORDER BY start_date DESC"
    );

    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ADD EDUCATION
router.post("/", async (req, res) => {
  try {
    let { degree, institution, start_date, end_date, description } = req.body;

    if (end_date === "present") end_date = null;

    const result = await pool.query(
      `INSERT INTO education (degree, institution, start_date, end_date, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [degree, institution, start_date, end_date, description]
    );

    res.json({ data: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE EDUCATION
router.put("/:id", async (req, res) => {
  try {
    let { degree, institution, start_date, end_date, description } = req.body;

    if (end_date === "present") end_date = null;

    const result = await pool.query(
      `UPDATE education
       SET degree = COALESCE($1, degree),
           institution = COALESCE($2, institution),
           start_date = COALESCE($3, start_date),
           end_date = $4,
           description = COALESCE($5, description)
       WHERE id = $6
       RETURNING *`,
      [degree, institution, start_date, end_date, description, req.params.id]
    );

    res.json({ data: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE EDUCATION
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM education WHERE id=$1", [req.params.id]);

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;