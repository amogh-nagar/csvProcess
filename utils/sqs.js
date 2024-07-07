const AWS = require("aws-sdk");
AWS.config.update({
  region: 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
let sqs;
let sqsSetup = {
  init: () => {
    sqs = new AWS.SQS();
    console.log("SQS Instance Created");
  },
  getSQS: () => {
    return sqs;
  },
};
module.exports = sqsSetup;
