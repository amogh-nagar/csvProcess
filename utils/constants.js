const AWS = require("aws-sdk");
const { v4: uuid } = require("uuid");
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_ACCOUNT_REGION,
});

module.exports = {
  product_queue_batch: 50,
  uploadToS3: async (imageBuffer) => {
    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${uuid()}.jpg`,
      Body: imageBuffer,
      ContentType: "image/jpeg",
    };

    const data = await s3.upload(s3Params).promise();
    return data.Location;
  },
};
