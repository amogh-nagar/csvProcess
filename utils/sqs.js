const { SQSClient } = require("@aws-sdk/client-sqs");
let sqs;
let sqsSetup = {
  init: () => {
    sqs = new SQSClient({
      region: process.env.AWS_ACCOUNT_REGION,
      credentials: {
        accountId: process.env.AWS_ACCOUNT_ID,
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
