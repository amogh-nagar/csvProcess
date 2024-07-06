const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

const FileSchema = new Schema(
  {
    name: {
      type: String,
      require: true,
    },
    url: {
      type: String,
      require: true,
    },
    noOfRows: {
      type: Number,
      require: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", FileSchema);
