import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;

// Routes
import authRoutes from "./routes/authRoutes.js";
import experienceRoutes from "./routes/experience.js";
import educationRoutes from "./routes/education.js";
import messageRoutes from "./routes/messages.js";
import projectRoutes from "./routes/projects.js";
import skillRoutes from "./routes/skills.js";
import dashboardRoutes from "./routes/dashboard.js";
import aboutRoutes from "./routes/about.js";
import resumeRoutes from "./routes/resume.js";
import feedbackRoutes from "./routes/feedback.js";
dotenv.config();

const app = express();

// ==================
// ✅ MIDDLEWARE (FIXED)
// ==================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 🔥 IMPORTANT FIX

// ==================
// ✅ POSTGRESQL CONNECTION
// ==================

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Test DB Connection
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL Connected");
    client.release();
  } catch (err) {
    console.log("❌ DB Error:", err.message);
  }
})();

// ==================
// ✅ ROUTES
// ==================

app.use("/api/auth", authRoutes);
app.use("/api/experience", experienceRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/feedback", feedbackRoutes);
app.use("/api/education", educationRoutes);
// ==================
// ✅ INIT DB
// ==================

app.get("/init-db", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS about (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        position VARCHAR(100),
        description TEXT,
        email VARCHAR(100),
        phone VARCHAR(20),
        experience VARCHAR(50)
      );

      -- 🔥 FIX HERE
      CREATE TABLE IF NOT EXISTS experience (
        id SERIAL PRIMARY KEY,
        company VARCHAR(100),
        role VARCHAR(100),
        start_date DATE,
        end_date DATE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 🔥 FIX HERE
      CREATE TABLE IF NOT EXISTS education (
        id SERIAL PRIMARY KEY,
        degree VARCHAR(100),
        institution VARCHAR(100),
        start_date DATE,
        end_date DATE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100),
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100),
        description TEXT,
        category VARCHAR(50),
        tech TEXT,
        link TEXT,
        github TEXT,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        category VARCHAR(50),
        percentage INTEGER,
        icon TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS resume (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100),
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100),
        rating INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    res.send("All tables created ✅");

  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ==================
// ✅ ROOT
// ==================

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// ==================
// ✅ SERVER START
// ==================

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});