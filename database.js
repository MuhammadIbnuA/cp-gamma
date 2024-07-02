const admin = require("firebase-admin");
require("dotenv").config();
var serviceAccount = require("./admin.json");

// Initialize Firebase Admin SDK using environment variables
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.databaseURL,
  storageBucket: process.env.storageBucket,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { db, bucket };
