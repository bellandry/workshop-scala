const Redis = require("ioredis");

const redisConfig = {
  host: "127.0.0.1",
  port: 6380,
  maxRetriesPerRequest: null,
};

const connection = new Redis(redisConfig);

module.exports = connection;
