const express = require("express");
const pool = require("./config/db");
const redisClient = require("./config/redis");
const { Queue } = require("bullmq");
const dotenv = require("dotenv");
const loggerMiddleware = require("./middlewares/logger");
const rateLimiter = require("./middlewares/rateLimiter");

dotenv.config();

const TicketRepository = require("./repositories/ticket.repository");
const TicketService = require("./services/ticket.service");
const TicketController = require("./controllers/ticket.controller");

const app = express();
app.use(express.json());
app.use(loggerMiddleware);

const ticketQueue = new Queue("ticket-processing", {
  connection: redisClient,
});

const ticketRepository = new TicketRepository(pool, redisClient);
const ticketService = new TicketService(ticketRepository, pool, ticketQueue);
const ticketController = new TicketController(ticketService);

// Get available tickets
app.get("/event-tickets/:id", ticketController.getTickets);

// Buy tickets
app.post("/buy-tickets/:id", rateLimiter, ticketController.buyTicket);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[APP]: Server running on port ${PORT}`);
});
