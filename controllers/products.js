
const { Producer } = require("sqs-producer");
const { getSQS } = require("../utils/sqs");
const producer = Producer.create({
  queueUrl: process.env.MESSAGE_QUEUE_URL,
  region: process.env.MESSAGE_QUEUE_REGION,
  sqs: getSQS()
});
exports.uploadProducts = async (req, res, next) => {
    
    await producer.send({
        id: 'test',
        body: "Hello, It works!"
    })
};
