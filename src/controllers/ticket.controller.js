const { z } = require("zod");

const idSchema = z.object({
  id: z.string(),
});

const buyerSchema = z.object({
  userId: z.number().min(1),
  quantity: z.number().min(1),
  email: z.email(),
});

class TicketController {
  constructor(ticketService) {
    this.ticketService = ticketService;
  }

  getTickets = async (req, res, next) => {
    try {
      const validateId = idSchema.parse(req.params);
      const { id: eventId } = validateId;

      const result = await this.ticketService.getTickets(eventId);

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Zod Error", details: error.errors });
      }

      next(error);
    }
  };

  buyTicket = async (req, res, next) => {
    try {
      const validateId = idSchema.parse(req.params);
      const { id: eventId } = validateId;

      const validateBody = buyerSchema.parse(req.body);
      const { userId, quantity, email } = validateBody;

      const result = await this.ticketService.purchaseTickets({
        eventId,
        userId,
        quantity,
        email,
      });

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Zod Error", details: error.errors });
      }

      if (error.massage === "NOT_ENOUGH_TICKETS") {
        return res.status(400).json({ error: "Not enough remaining tickets" });
      }

      if (error.massage === "EVENT_NOT_FOUND") {
        return res.status(404).json({ error: "Event not found" });
      }

      if (error.massage === "USER_NOT_FOUND") {
        return res.status(404).json({ error: "User not found" });
      }

      if (error.massage === "INVALID_QUANTITY") {
        return res.status(400).json({ error: "Invalid quantity" });
      }

      next(error);
    }
  };
}

module.exports = TicketController;
