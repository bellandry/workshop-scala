const express = require("express");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const { z } = require("zod");
dotenv.config();

const app = express();
app.use(express.json());

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

// Validation schema
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  age: z.number().min(18),
});

// Fetch users
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    const users = result.rows;

    res.json({ data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unexpected error" });
  }
});

// Create User
app.post("/users", async (req, res) => {
  try {
    const validateUser = userSchema.parse(req.body);
    const { name, email, password, age } = validateUser;

    const verifUser = await pool.query(
      "SELECT email FROM users WHERE email = $1",
      [email],
    );
    const userExist = verifUser.rows[0];

    if (userExist) {
      return res.status(400).json({ error: "Email already used !" });
    }

    const createUser = await pool.query(
      "INSERT INTO users (name, email, password, age) VALUES($1, $2, $3, $4) RETURNING *",
      [name, email, password, age],
    );
    const newUser = createUser.rows[0];

    res.json({ data: newUser });
  } catch (error) {
    // if (error instanceof z.ZodError) {
    //   return res.status(400).json({
    //     error: "Zod Validation Error",
    //     details: error.errors,
    //   });
    // }
    console.error(error);
    res.status(500).json({ error: "Unexpected error" });
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log("Server Running on " + PORT);
});
