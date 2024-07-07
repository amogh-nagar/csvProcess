const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.AWS_REGION ,
});
let sqs;
let sqsSetup = {
  init: () => {
    sqs = new AWS.SQS({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    console.log("SQS Instance Created");
  },
  getSQS: () => {
    return sqs;
  },
};
module.exports = sqsSetup;
