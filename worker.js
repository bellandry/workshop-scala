const { Worker } = require("bullmq");
const connection = require("./redis");

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
    console.log(
      `[WORKER]: Treatment Started for job #${job.id} for user ${job.data.email}`,
    );

    try {
      //Heavy job
      heavyPdfGenerator();

      //do some heavy work
      await waitNetwork();

      console.log(
        `[WORKER]: Treatment Completed for job #${job.id}, pdf generated & email sent`,
      );
    } catch (error) {
      console.error(
        `[WORKER]: Treatment Failed for job #${job.id}, err : ${error}`,
      );
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
