const mongoose = require("mongoose");
const express = require("express");
const app = express();
const { init } = require("./utils/sqs");
require("dotenv").config();
app.use(express.json());

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
});
