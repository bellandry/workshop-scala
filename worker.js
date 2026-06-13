const { Worker } = require("bullmq");
const connection = require("./redis");
const pool = require("./db");

// Heavy PDF generator simulator
const heavyPdfGenerator = (duration = 500) => {
  const start = Date.now();
  while (Date.now() - start < duration) {
    // Do nothing
  }
};

const waitNetwork = (duration = 50) => {
  return new Promise((resolve) => setTimeout(resolve, duration));
};

const worker = new Worker(
  "ticket-processing",
  async (job) => {
    const client = await pool.connect();
    console.log(
      `[WORKER]: Treatment Started for job #${job.id} for user ${job.data.email}`,
    );

    try {
      const { userId, eventId, quantity } = job.data;

      //Heavy job
      heavyPdfGenerator();

      const invoice = await client.query(
        'INSERT INTO invoices ("userId", "eventId", quantity) VALUES($1, $2, $3) RETURNING *',
        [userId, eventId, quantity],
      );
      const newInvoice = invoice.rows[0];

      //do some heavy work
      await waitNetwork();

      console.log(
        `[WORKER]: Treatment Completed for job #${job.id}, pdf generated & email sent. invoice N° : ${newInvoice.id}`,
      );
    } catch (error) {
      console.error(
        `[WORKER]: Treatment Failed for job #${job.id}, err : ${error}`,
      );
    } finally {
      client.release();
    }
  },
  { connection, concurrency: 2 },
);

worker.on("error", (error) => {
  console.error(`[WORKER]: An error occured, err : ${error}`);
});

worker.on("failed", (job, error) => {
  console.error(`[WORKER]: A job failed, err : ${error}`);
});
