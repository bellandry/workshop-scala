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
}

module.exports = TicketController;
