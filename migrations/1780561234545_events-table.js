/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable("events", {
    id: "serial primary key",
    name: "varchar(255) not null",
    total_tickets: "integer not null",
    sold_tickets: "integer default 0",
    createdAt: "timestamp default now()",
  });

  pgm.sql(`
    INSERT INTO events (name, total_tickets, sold_tickets)
    VALUES ('Concert Gims', 1000, 0), ('Coupe du monde', 2000, 30);
    `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("events");
};
