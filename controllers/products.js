const { Producer } = require("sqs-producer");
const { getSQS } = require("../utils/sqs");
const { v4: uuid } = require("uuid");
const ProductsFile = require("../models/Files");
const { Readable } = require("stream");
const csvParser = require("csv-parser");
const { product_queue_batch } = require("../utils/constants");
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
  const singleBatchProductsInitialValue = {
    products: [],
    requestID,
  };
  let totalProducts = 0;
  let singleBatchProducts = singleBatchProductsInitialValue;
  const chunks = stream.pipe(csvParser());
  chunks.on("data", (row) => {
    const product = {
      id: row["S. No."],
      product: {
        productID: uuid(),
        name: row["Product Name"],
        inputUrls: row["Input Image Urls"],
      },
    };
    singleBatchProducts.products.push(product);
    totalProducts++;
    if (product_queue_batch == singleBatchProducts.products.length) {
      products.push({
        id: uuid(),
        body: JSON.stringify(singleBatchProducts),
      });
      singleBatchProducts = singleBatchProductsInitialValue;
    }
  });
  chunks.on("end", async () => {
    products.push({
      id: uuid(),
      body: JSON.stringify(singleBatchProducts),
    });
    await producer.send(products);
    const newFile = new ProductsFile({
      name,
      requestID,
      noOfRows: totalProducts,
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
