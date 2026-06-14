const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const TicketService = require("../src/services/ticket.service");

describe("TicketServie - purchaseTicket", () => {
  (test("Normal case: purchase and tickets stock available"),
    async () => {
      const mockTicketRepo = {
        updateTicketStock: async (client, eventId, userId, quantity) => ({
          success: true,
        }),
        invalidateCache: async () => {},
      };

      // Create mock pool
      const mockPool = {
        connect: async () => ({
          query: async (sql) => {
            return { rows: [] };
          },
          release: () => {},
        }),
      };

      // Create mock ticket queue
      const mockTicketQueue = {
        add: async (jobName, data) => {
          return { id: "job_123" };
        },
      };

      // Create instance of ticket sevice
      const ticketService = new TicketService(
        mockTicketRepo,
        mockPool,
        mockTicketQueue,
      );

      await ticketService.purchaseTickets({
        eventId: 1,
        userId: 1,
        quantity: 1,
        email: "[EMAIL_ADDRESS]",
      });

      assert.deepStrictEqual(result, {
        message: "Purchase succesfully proceed",
      });
    });

  test("Error case: Not enough tickets available", async () => {
    const mockTicketRepo = {
      updateTicketStock: async (client, eventId, userId, quantity) => {
        throw new Error("NOT_ENOUGH_TICKETS");
      },
      invalidateCache: async () => {},
    };

    // Create mock pool
    const mockPool = {
      connect: async () => ({
        query: async (sql) => {
          return { rows: [] };
        },
        release: () => {},
      }),
    };

    // Create mock ticket queue
    const mockTicketQueue = {
      add: async (jobName, data) => {
        return { id: "job_123" };
      },
    };

    // Create instance of ticket sevice
    const ticketService = new TicketService(
      mockTicketRepo,
      mockPool,
      mockTicketQueue,
    );

    await assert.rejects(
      ticketService.purchaseTickets({
        eventId: 1,
        userId: 1,
        quantity: 1,
        email: "[EMAIL_ADDRESS]",
      }),
      { message: "NOT_ENOUGH_TICKETS" },
    );
  });
});
