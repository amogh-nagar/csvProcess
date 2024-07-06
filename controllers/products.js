const { Producer } = require("sqs-producer");
const { getSQS } = require("../utils/sqs");
const { v4: uuid } = require("uuid");
const ProductsFile = require("../models/Files");
const { Readable } = require("stream");
const csvParser = require("csv-parser");
const producer = Producer.create({
  queueUrl: process.env.MESSAGE_QUEUE_URL,
  region: process.env.MESSAGE_QUEUE_REGION,
  sqs: getSQS(),
});
exports.uploadProducts = async (req, res, next) => {
  const webHookUrl = req.body.webHookUrl;
  const { data, name } = req.files.file;
  const stream = Readable.from(data);
  const requestID = uuid();
  const products = [];
  const chunks = stream.pipe(csvParser());
  chunks.on("data", (row) => {
    const product = {
      id: row["S. No."],
      body: JSON.stringify({
        productID: uuid(),
        requestID,
        name: row["Product Name"],
        inputUrls: row["Input Image Urls"],
      }),
    };
    products.push(product);
  });
  chunks.on("end", async () => {
    await producer.send(products);
    const newFile = new ProductsFile({
      name,
      requestID,
      noOfRows: products.length,
      webHookUrl: webHookUrl || null,
    });
    await newFile.save();
    res.status(200).json({
      requestID,
      message: "Images of the Product will be Processed Soon!",
    });
  });
  chunks.on("error", (error) => {
    console.error("Error processing CSV:", error);
    res.status(500).json({
      message: "Error processing file, Please Try Again!",
    });
  });
};
