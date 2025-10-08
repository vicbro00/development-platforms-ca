import express from "express";
import { pool } from "../database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { ResultSetHeader } from "mysql2";

const router = express.Router();

// GET all articles (public)
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT a.id, a.title, a.body, a.category, a.created_at, u.email AS author_email
            FROM articles a
            JOIN users u ON a.submitted_by = u.id
            ORDER BY a.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch articles" });
    }
});

// POST new article (protected)
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { title, body, category } = req.body;
        const userId = (req as any).user.userId;

        if (!title || !body || !category) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const [result]: [ResultSetHeader, any] = await pool.execute(
            "INSERT INTO articles (title, body, category, submitted_by) VALUES (?, ?, ?, ?)",
            [title, body, category, userId]
        );

        res.status(201).json({ message: "Article created", id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: "Failed to create article" });
    }
});

export default router;