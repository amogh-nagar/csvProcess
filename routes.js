const express = require("express");
const { uploadProducts, checkStatusOfRequest, dummyWebHook } = require("./controllers/products");
const router = express.Router();

router.post("/uploadProducts", uploadProducts);
router.get("/checkStatusOfRequest", checkStatusOfRequest)
router.use("/dummyWebHook", dummyWebHook)
module.exports = router;
