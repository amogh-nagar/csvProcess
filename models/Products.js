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

ProductSchema.index({ requestID: 1 });
module.exports = mongoose.model("Product", ProductSchema);
