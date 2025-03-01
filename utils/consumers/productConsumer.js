const { getSQS } = require("../sqs");
const ProductsFile = require("../../models/Files");
const Products = require("../../models/Products");
const axios = require("axios");
const sharp = require("sharp");
const { uploadToS3 } = require("../constants");
module.exports = () => {
  const sqs = getSQS();
  try {
    async function receiveMessages() {
      const params = {
        QueueUrl: process.env.MESSAGE_QUEUE_URL,
        VisibilityTimeout: 400,
        WaitTimeSeconds: 20,
      };

      try {
        const data = await sqs.receiveMessage(params).promise();
        const messages = data.Messages || [];
        console.log("Consumed Message", messages.length);
        for (const message of messages) {
          await processMessage(message);
          await deleteMessage(message.ReceiptHandle);
        }
        await receiveMessages();
      } catch (err) {
        console.error(err);
      }
    }
    receiveMessages();
  } catch (err) {
    console.error("Error while consuming", err.message);
  }

  console.log("Product Consumer Started");
};
async function processMessage(message) {
  try {
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
          console.log("Processing URLs");
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
            productID: product.productID,
            requestID,
            inputUrls,
            outputUrls,
          });
        } catch (error) {
          console.error("Error processing image:", error);
        }
      }
      console.log("Saving to DB");
      await Products.insertMany(products);
      const countOfProducts = await Products.countDocuments({
        requestID,
      });
      const productFile = await ProductsFile.findOne({
        requestID,
      });
      if (
        productFile.noOfRows == countOfProducts &&
        productFile.webHookDetails.url?.length > 0 &&
        productFile.webHookDetails.status == "pending"
      ) {
        await callWebHook(productFile.webHookDetails.url, requestID);
      }
    }
  } catch (error) {
    console.error("Error processing Message:", error);
  }
}
async function deleteMessage(receiptHandle) {
  const sqs = getSQS();
  const params = {
    QueueUrl: process.env.MESSAGE_QUEUE_URL,
    ReceiptHandle: receiptHandle,
  };

  try {
    await sqs.deleteMessage(params).promise();
  } catch (err) {
    console.error(err);
  }
}
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
    const request = await axios.post(url, {
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
          "webHookDetails.response": JSON.stringify(request.data),
        },
      }
    );
  } catch (err) {
    await ProductsFile.updateOne(
      {
        requestID,
      },
      {
        $set: {
          "webHookDetails.status": "failed",
          "webHookDetails.response": JSON.stringify(err),
        },
      }
    );
  }
}
