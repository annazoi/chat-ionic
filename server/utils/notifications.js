const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cors = require("cors");
const dotenv = require("dotenv");
const serviceAccount = require("PATH_TO_YOUR_SERVICE_ACCOUNT_JSON_FILE");

const notification = {
  title: body.title,
  body: body.body,
};

const data = {
  key1: "value1",
  key2: "value2",
};

let app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
dotenv.config();
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL,
});
