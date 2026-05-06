import express from "express";
import auth from "../middleware/auth.js";
import { pool } from "../server.js";

const router = express.Router();

// ✅ DASHBOARD API (POSTGRESQL)
router.get("/", auth, async (req, res) => {
  try {

    // Parallel queries (fast)
    const [
      users,
      projects,
      skills,
      experience,
      messages,
      unread,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM projects"),
      pool.query("SELECT COUNT(*) FROM skills"),
      pool.query("SELECT COUNT(*) FROM experience"),
      pool.query("SELECT COUNT(*) FROM messages"),
      pool.query("SELECT COUNT(*) FROM messages WHERE is_read = false"),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(users.rows[0].count),
        totalProjects: parseInt(projects.rows[0].count),
        totalSkills: parseInt(skills.rows[0].count),
        totalExperience: parseInt(experience.rows[0].count),
        totalMessages: parseInt(messages.rows[0].count),
        unreadMessages: parseInt(unread.rows[0].count),
      },
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;