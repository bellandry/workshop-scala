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

  async updateTicketStock(client, eventId, userId, quantity) {
    const user = await client.query(
      "SELECT * FROM users WHERE id = $1 FOR UPDATE",
      [userId],
    );

    if (user.rows.length === 0) throw new Error("USER_NOT_FOUND");

    const checkAvailability = await client.query(
      "SELECT total_tickets, sold_tickets FROM events WHERE id = $1 FOR UPDATE",
      [eventId],
    );

    if (checkAvailability.rows.length === 0) throw new Error("EVENT_NOT_FOUND");

    const { total_tickets, sold_tickets } = checkAvailability.rows[0];
    const available = total_tickets - sold_tickets;

    if (available < quantity) throw new Error("NOT_ENOUGH_TICKETS");

    const newSoldTickets = sold_tickets + quantity;

    await client.query("UPDATE events SET sold_tickets = $1 WHERE id = $2", [
      newSoldTickets,
      eventId,
    ]);

    return { success: true };
  }

  async invalidateCache(eventId) {
    const cachedKey = `event:${eventId}:stock`;
    await this.redisClient.del(cachedKey);
  }
}

module.exports = TicketRepository;
