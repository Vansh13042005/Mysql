import express from "express";
import { pool } from "../server.js";

const router = express.Router();

// 🔥 FIXED Duration Calculation (accurate)
function calculateExperience(startDate, endDate) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  // 🔥 Adjust days
  if (days < 0) {
    months--;
  }

  // 🔥 Adjust months
  if (months < 0) {
    years--;
    months += 12;
  }

  let result = "";

  // ✅ Full year case
  if (years > 0 && months === 0) {
    result = `${years} year${years > 1 ? "s" : ""}`;
  } else {
    if (years > 0) {
      result += `${years} year${years > 1 ? "s" : ""} `;
    }
    if (months > 0) {
      result += `${months} month${months > 1 ? "s" : ""}`;
    }
  }

  return result.trim() || "0 month";
}

// ✅ GET ALL EXPERIENCE
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM experience ORDER BY start_date DESC"
    );

    const data = result.rows.map((exp) => ({
      id: exp.id,
      company: exp.company,
      role: exp.role,
      description: exp.description,
      start_date: exp.start_date,
      end_date: exp.end_date,
      current: exp.end_date === null,
      duration: calculateExperience(exp.start_date, exp.end_date),
    }));

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ADD EXPERIENCE
router.post("/", async (req, res) => {
  try {
    let { company, role, start_date, end_date, description } = req.body;

    // 🔥 Handle "present"
    if (end_date === "present" || end_date === "") {
      end_date = null;
    }

    // 🔥 Validation
    if (!start_date) {
      return res.status(400).json({ error: "start_date is required" });
    }

    const start = new Date(start_date);
    if (isNaN(start)) {
      return res.status(400).json({ error: "Invalid start_date format (use YYYY-MM-DD)" });
    }

    if (end_date) {
      const end = new Date(end_date);
      if (isNaN(end)) {
        return res.status(400).json({ error: "Invalid end_date format (use YYYY-MM-DD)" });
      }
    }

    // 🔥 OPTIONAL: Prevent duplicate
    const existing = await pool.query(
      `SELECT * FROM experience WHERE company=$1 AND role=$2 AND start_date=$3`,
      [company, role, start_date]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Experience already exists" });
    }

    const result = await pool.query(
      `INSERT INTO experience (company, role, start_date, end_date, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [company, role, start_date, end_date, description]
    );

    res.json({ data: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE EXPERIENCE
router.put("/:id", async (req, res) => {
  try {
    let { company, role, start_date, end_date, description } = req.body;

    // 🔥 handle "present"
    if (end_date === "present" || end_date === "") {
      end_date = null;
    }

    const result = await pool.query(
      `UPDATE experience
       SET company = COALESCE($1, company),
           role = COALESCE($2, role),
           start_date = COALESCE($3, start_date),
           end_date = $4,
           description = COALESCE($5, description)
       WHERE id = $6
       RETURNING *`,
      [company, role, start_date, end_date, description, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Experience not found" });
    }

    res.json({ data: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;