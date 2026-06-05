const express = require("express");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const { z } = require("zod");
const { Queue } = require("bullmq");
const connection = require("./redis");

dotenv.config();

const ticketQueue = new Queue("ticket-processing", { connection });

const app = express();
app.use(express.json());

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

const monitorPool = () => {
  const total = pool.totalCount;
  const idle = pool.idleCount;
  const waiting = pool.waitingCount;
  const active = total - idle;

  console.clear();
  console.log(`--- Postgres Pool Status ---`);
  console.log(`Active Connexions      : ${active}`);
  console.log(`Idle Connexions        : ${idle}`);
  console.log(`Total Connexions       : ${total} / 20`);
  console.log(`Waiting Requests       : ${waiting}`);
  console.log(`----------- End ------------`);
};

setInterval(monitorPool, 1000);

// Validation schema
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  age: z.number().min(18),
});

const idEventSchema = z.object({
  id: z.string(),
});

const idUserSchema = z.object({
  userId: z.number().min(1),
  quantity: z.number().min(1),
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Zod Validation Error",
        details: error.errors,
      });
    }
    console.error(error);
    res.status(500).json({ error: "Unexpected error" });
  }
});

app.get("/event-tickets/:id", async (req, res) => {
  try {
    const idValidate = idEventSchema.parse(req.params);
    const { id: eventId } = idValidate;

    const result = await pool.query(
      "SELECT name, total_tickets, sold_tickets FROM events WHERE id = $1",
      [eventId],
    );

    const event = result.rows[0];

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const { name, total_tickets, sold_tickets } = event;
    const ticketLeft = total_tickets - sold_tickets;

    res.json({
      data: { eventName: name, total_tickets, sold_tickets, ticketLeft },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Zod Validation Error",
        details: error.errors,
      });
    }
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Buy Event Ticket
app.post("/buy-tickets/:id", async (req, res) => {
  const client = await pool.connect(); // Etablir une connexion dédiée a la transaction

  try {
    const idEvent = idEventSchema.parse(req.params);
    const { id: eventId } = idEvent;
    const validateUser = idUserSchema.parse(req.body);
    const { userId, quantity } = validateUser;

    // Début de la transaction
    await client.query("BEGIN");

    // Verify event exists
    const eventExist = await client.query(
      "SELECT name, total_tickets, sold_tickets FROM events WHERE id = $1 FOR UPDATE",
      [eventId],
    );
    const event = eventExist.rows[0];

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    //verify user exist
    const userExist = await client.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    const user = userExist.rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    //verify ticket left
    const { total_tickets, sold_tickets } = event;
    const ticketLeft = total_tickets - sold_tickets;

    if (ticketLeft < quantity) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Not enough tickets left" });
    }

    //update ticket
    const newQuantity = quantity + sold_tickets;
    const updateTicket = await client.query(
      "UPDATE events SET sold_tickets =  $1 WHERE id = $2 RETURNING *",
      [newQuantity, eventId],
    );
    const updatedEvent = updateTicket.rows[0];

    await client.query("COMMIT");

    await ticketQueue.add(
      "generate-and-send",
      {
        userId,
        eventId,
        quantity,
        email: user.email,
      },
      {
        attempts: 3,
        backoff: 5000,
      },
    );

    res.json({
      message: `Ticket bought successfully for ${event.name} event`,
      data: updatedEvent,
      email: user.email,
      boughTickets: quantity,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Zod Validation Error",
        details: error.errors,
      });
    }
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log("Server Running on " + PORT);
});
