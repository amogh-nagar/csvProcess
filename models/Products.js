const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    requestID: {
      type: String,
      required: true,
    },
    productID: {
      type: String,
      required: true,
    },
    inputUrls: [
      {
        type: String,
      },
    ],
    outputUrls: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

ProductSchema.index(
  { productID: 1, requestID: 1 },
  {
    unique: true,
  }
);
module.exports = mongoose.model("Product", ProductSchema);
