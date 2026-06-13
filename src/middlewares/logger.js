const pino = require("pino");
const pinoHttp = require("pino-http");
const dotenv = require("dotenv");

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const baseLogger = pino({
  level: isProduction ? "INFO" : "DEBUG",
  transport: !isProduction
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          singleLine: false,
          ignore: "pid, hostname",
          translateTime: "SYS:standard",
        },
      }
    : undefined,
});

const loggerMiddleware = pinoHttp({
  logger: baseLogger,
});

module.exports = loggerMiddleware;
