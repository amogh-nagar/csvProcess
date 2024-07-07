const { Producer } = require("sqs-producer");
const { getSQS } = require("../utils/sqs");
const { v4: uuid } = require("uuid");
const ProductsFile = require("../models/Files");
const { Readable } = require("stream");
const csvParser = require("csv-parser");
const { product_queue_batch } = require("../utils/constants");
const Products = require("../models/Products");
const producer = Producer.create({
  queueUrl: process.env.MESSAGE_QUEUE_URL,
  region: process.env.MESSAGE_QUEUE_REGION,
  sqs: getSQS(),
});
const requiredHeaders = ["S. No.", "Product Name", "Input Image Urls"];
exports.uploadProducts = async (req, res, next) => {
  try {
    const webHookUrl = req.body.webHookUrl;
    const { data, name } = req.files.file;
    const stream = Readable.from(data);
    const requestID = uuid();
    const products = [];
    const singleBatchProductsInitialValue = {
      products: [],
      requestID,
    };
    let totalProducts = 0,
      isValid = true;
    let singleBatchProducts = singleBatchProductsInitialValue;
    const chunks = stream.pipe(csvParser());
    chunks.on("headers", (headers) => {
      if (
        headers.length !== requiredHeaders.length ||
        !requiredHeaders.every((header) => headers.includes(header))
      ) {
        isValid = false;
        stream.destroy();
      }
    });
    chunks.on("data", (row) => {
      if (isValid) {
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
      }
    });
    chunks.on("end", async () => {
      if (isValid) {
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
      } else {
        res.status(400).json({
          message:
            "Invalid CSV, Please try again with Valid CSV, the Headers of the CSV must be S. No., Product Name, Input Image Urls",
        });
      }
    });
    chunks.on("error", (error) => {
      console.error("Error processing CSV:", error);
      res.status(500).json({
        message: "Error processing file, Please Try Again!",
      });
    });
  } catch (err) {
    next(err);
  }
};

exports.checkStatusOfRequest = async (req, res, next) => {
  try {
    const requestID = req.query.requestID;
    const countOfProducts = await Products.countDocuments({
      requestID,
    });
    const productFile = await ProductsFile.findOne({
      requestID,
    });
    if (productFile.noOfRows == countOfProducts) {
      return res.status(200).json({
        requestID,
        status: "completed",
      });
    } else {
      return res.status(200).json({
        requestID,
        status: "pending",
        percentageOfProductsProcessed:
          (countOfProducts / productFile.noOfRows) * 100,
      });
    }
  } catch (err) {
    next(err);
  }
};
