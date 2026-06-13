class TicketRepository {
  constructor(pool, redisClient) {
    this.pool = pool;
    this.redisClient = redisClient;
  }

  async getAvailableTickets(eventId) {
    // Vérifier le cache
    const cachedKey = `event:${eventId}:stock`;
    const cachedStock = await this.redisClient.get(cachedKey);

    if (cachedStock) {
      return {
        source: "cache",
        data: parseInt(cachedStock),
      };
    }

    // Vérifier la base de données
    const result = await this.pool.query(
      "SELECT total_tickets, sold_tickets FROM events WHERE id = $1",
      [eventId],
    );

    if (result.rows.length === 0) return null;

    const { total_tickets, sold_tickets } = result.rows[0];
    const available = total_tickets - sold_tickets;

    // Sauvegarder dans le cache
    await this.redisClient.setex(cachedKey, 10, available);

    return {
      source: "database",
      data: available,
    };
  }
}

module.exports = TicketRepository;
