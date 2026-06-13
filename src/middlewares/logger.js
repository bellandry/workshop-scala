const pino = require("pino");
const pinoHttp = require("pino-http");
const dotenv = require("dotenv");

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const baseLogger = pino({
  level: isProduction ? "INFO" : "DEBUG",
  transport: !isProduction
    ? {
        targets: [
          {
            target: "pino/file",
            leve: "info",
            options: {
              destination: "./logs/app.log",
            },
          },
          {
            target: "pino/file",
            leve: "warn",
            options: {
              destination: "./logs/error.log",
            },
          },
        ],
      }
    : undefined,
});

const loggerMiddleware = pinoHttp({
  logger: baseLogger,
});

module.exports = loggerMiddleware;
