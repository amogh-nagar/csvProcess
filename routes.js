const express = require("express");
const { uploadProducts } = require("./controllers/products");
const router = express.Router();

router.post("/uploadProducts", uploadProducts);

module.exports = router;
