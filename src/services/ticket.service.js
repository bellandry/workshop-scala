class TicketService {
  constructor(ticketRepository, pool, ticketQueue) {
    this.ticketRepo = ticketRepository;
    this.pool = pool;
    this.ticketQueue = ticketQueue;
  }

  async getTickets(eventId) {
    return this.ticketRepo.getAvailableTickets(eventId);
  }
}

module.exports = TicketService;
