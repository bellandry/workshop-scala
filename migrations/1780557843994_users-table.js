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
  pgm.createTable("users", {
    id: "serial primary key",
    name: "varchar(50) not null",
    email: "varchar(255) not null",
    password: "varchar(255) not null",
    age: "integer not null",
    createdAt: "timestamp default now()",
  });

  pgm.sql(`
    INSERT INTO users (name, email, password, age)
    VALUES ('toto', 'toto@localhost.com', 'kjsdnfknsiqduhsigbjfdjhgdfghu', 20);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("users");
};
