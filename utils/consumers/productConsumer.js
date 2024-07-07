const { Consumer } = require("sqs-consumer");
const { getSQS } = require("../sqs");
const ProductsFile = require("../../models/Files");
const Products = require("../../models/Products");
const axios = require("axios");
const sharp = require("sharp");
const { uploadToS3 } = require("../constants");
module.exports = () => {
  const app = Consumer.create({
    queueUrl: process.env.MESSAGE_QUEUE_URL,
    sqs: getSQS(),
    handleMessage: async (message) => {
      console.log("Processing Message");
      const Body = JSON.parse(message.Body),
        requestID = Body.requestID;
      const requestFile = await ProductsFile.findOne({
        requestID,
      });
      if (requestFile) {
        const products = [];
        for (let productDetails of Body.products) {
          const product = productDetails.product;
          try {
            const inputUrls = product.inputUrls.split(","),
              outputUrls = [];
            for (let url of inputUrls) {
              url = url.trim();
              try {
                const imageBuffer = await downloadURL(url);
                if (!imageBuffer || !imageBuffer.length) {
                  outputUrls.push("");
                } else {
                  const processedImageBuffer = await compressURL(imageBuffer);
                  const s3Url = await uploadToS3(processedImageBuffer);
                  outputUrls.push(s3Url);
                }
              } catch (error) {
                console.error("Error processing image:", error);
              }
            }
            products.push({
              name: product.name,
              requestID,
              inputUrls,
              outputUrls,
            });
          } catch (error) {
            console.error("Error processing image:", error);
          }
        }
        await Products.insertMany(products);
        const countOfProducts = await Products.countDocuments({
          requestID,
        });
        const productFile = await ProductsFile.findOne({
          requestID,
        });
        if (
          productFile.noOfRows == countOfProducts &&
          productFile.webHookDetails.status == "pending"
        ) {
          await callWebHook(productFile.webHookDetails.url, requestID);
        }
      }
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

async function compressURL(imageBuffer) {
  try {
    return await sharp(imageBuffer).jpeg({ quality: 50 }).toBuffer();
  } catch (err) {
    console.log("Error processing Image Buffer", err);
    return "";
  }
}
async function downloadURL(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary");
  } catch (err) {
    console.log("Error occurred", err);
    return "";
  }
}
async function callWebHook(url, requestID) {
  try {
    await axios.post(url, {
      requestID,
      status: "completed",
    });
    await ProductsFile.updateOne(
      {
        requestID,
      },
      {
        $set: {
          "webHookDetails.status": "completed",
        },
      }
    );
  } catch (err) {}
}
