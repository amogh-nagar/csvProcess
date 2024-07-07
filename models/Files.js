const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

const FileSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    requestID: {
      type: String,
      required: true,
    },
    noOfRows: {
      type: Number,
      required: true,
    },
    webHookDetails: {
      status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
      },
      url: {
        type: String,
      },
      response: {
        type: String,
      },
    },
  },
  { timestamps: true }
);
FileSchema.index(
  { requestID: 1 },
  {
    unique: true,
  }
);
module.exports = mongoose.model("File", FileSchema);
