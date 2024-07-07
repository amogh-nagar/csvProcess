const express = require("express");
const { uploadProducts, checkStatusOfRequest } = require("./controllers/products");
const router = express.Router();

router.post("/uploadProducts", uploadProducts);
router.get("/checkStatusOfRequest", checkStatusOfRequest)
module.exports = router;
