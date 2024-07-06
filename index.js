const mongoose = require("mongoose");
const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
const { init } = require("./utils/sqs");
const initialiseConsumers = require("./utils/consumers/initialiseConsumers");
require("dotenv").config();
app.use(express.json());
app.use(fileUpload());
app.use("/", require("./routes"));

app.use((error, req, res, next) => {
  return res.status(500).json({
    message: "Some error occurred",
    error,
  });
});

app.listen(process.env.PORT || 8080, async () => {
  console.log(`Server Listening on PORT ${process.env.PORT}`);
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`MONGODB Started ${process.env.MONGO_URI}`);
  init();
  initialiseConsumers.init()
});
