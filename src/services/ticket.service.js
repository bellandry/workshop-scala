class TicketService {
  constructor(ticketRepository, pool, ticketQueue) {
    this.ticketRepo = ticketRepository;
    this.pool = pool;
    this.ticketQueue = ticketQueue;
  }

  async getTickets(eventId) {
    return this.ticketRepo.getAvailableTickets(eventId);
  }

  async purchaseTickets({ eventId, userId, quantity, email }) {
    if (quantity > 10 || quantity < 1) throw new Error("INVALID_QUANTITY");

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      await this.ticketRepo.updateTicketStock(
        client,
        eventId,
        userId,
        quantity,
      );

      await client.query("COMMIT");

      await Promise.all([
        this.ticketRepo.invalidateCache(eventId),
        this.ticketQueue.add("generate-and-send", {
          eventId,
          userId,
          quantity,
          email,
        }),
      ]);

      return { message: "Purchase succesfully proceed" };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = TicketService;
