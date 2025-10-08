//* CORS *//
import express, { Request, Response, NextFunction} from "express";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "./database.js";
import { ResultSetHeader } from "mysql2";

dotenv.config()

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Hello world!" });
});

// Interface for users
interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

// Interface for articles
interface Article {
  id: number;
  title: string;
  body: string;
  category: string;
  submitted_by: number;
  created_at: string;
}

// Interface for authenticating users
interface AuthenticatedRequest extends Request {
    user?: { userId: number };
}

// Get all users from the database
app.get("/users", async (req, res) => {
  try {
    // Fetch all users from DB
    const [rows] = await pool.execute(
      "SELECT id, email, password_hash, created_at FROM users"
    );

    const users = rows as User[];

    res.json(users);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Failed to fetch users",
    });
  }
});

// Register a new user
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const [result]: [ResultSetHeader, any] = await pool.execute(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      [email, hashedPassword]
    );

    const user: User = {
      id: result.insertId,
      email,
      password_hash: hashedPassword,
      created_at: new Date().toISOString()
    };

    res.status(201).json(user);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Failed to create user",
    });
  }
});

// Login an existing user
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
    const users = rows as User[];

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ 
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Get articles
app.get("/articles", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        articles.id, 
        articles.title, 
        articles.body, 
        articles.category, 
        articles.created_at, 
        users.email AS author_email
      FROM articles
      INNER JOIN users 
        ON articles.submitted_by = users.id
      ORDER BY articles.created_at DESC
    `);

    const articles = rows as Article[];
    res.json(articles);
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

// Authentication
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET not defined");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: number };
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid token" });
    }
}

// Create new article
app.post("/articles", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { title, body, category } = req.body;

        if (!title || !body || !category) {
            return res.status(400).json({ error: "Title, body, and category are required" });
        }

        const submitted_by = req.user?.userId;

        if (!submitted_by) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [result]: [ResultSetHeader, any] = await pool.execute(
            "INSERT INTO articles (title, body, category, submitted_by) VALUES (?, ?, ?, ?)",
            [title, body, category, submitted_by]
        );

        res.status(201).json({
            message: "Article created successfully",
            articleId: result.insertId,
        });
    } catch (error) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Failed to create article" });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});