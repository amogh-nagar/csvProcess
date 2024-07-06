const { Consumer } = require("sqs-consumer");
const { getSQS } = require("../sqs");


module.exports = () => {
  const app = Consumer.create({
    queueUrl: process.env.MESSAGE_QUEUE_URL,
    sqs: getSQS(),
    handleMessage: async (message) => {
      console.log("Message is", message);
    },
  });
  app.on("started", () => {
    console.log("Product Consumer Started");
  });
  app.on("error", (err) => {
    console.error(err.message);
  });

  app.on("processing_error", (err) => {
    console.error(err.message);
  });

  app.start();
};
