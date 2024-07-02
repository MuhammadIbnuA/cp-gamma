const { db } = require("../database");
const { FieldValue } = require("firebase-admin").firestore;
const {} = require("firebase-admin").firestore;

// Update biayasekolah document
exports.updateBiayaSekolah = async (req, res) => {
  try {
    const { historysiswaid, biayasekolahid } = req.params;
    const updatedFields = req.body;

    // Remove biayasekolahid from updatedFields
    delete updatedFields.biayasekolahid;

    const biayaSekolahRef = db
      .collection("historysiswa")
      .doc(historysiswaid)
      .collection("biayasekolah")
      .doc(biayasekolahid);
    const biayaSekolahDoc = await biayaSekolahRef.get();

    if (!biayaSekolahDoc.exists) {
      return res
        .status(404)
        .send(`BiayaSekolah document with id ${biayasekolahid} not found`);
    }

    await biayaSekolahRef.update({
      ...updatedFields,
      updatedAt: FieldValue.serverTimestamp(),
    });

    res
      .status(200)
      .send(
        `BiayaSekolah document with id ${biayasekolahid} updated successfully`
      );
  } catch (error) {
    res
      .status(500)
      .send("Error updating BiayaSekolah document: " + error.message);
  }
};

// Update payment status of biayasekolah document
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { historysiswaid, biayasekolahid } = req.params;
    const { isPaid } = req.body;

    const biayaSekolahRef = db
      .collection("historysiswa")
      .doc(historysiswaid)
      .collection("biayasekolah")
      .doc(biayasekolahid);
    const biayaSekolahDoc = await biayaSekolahRef.get();

    if (!biayaSekolahDoc.exists) {
      return res
        .status(404)
        .send(`BiayaSekolah document with id ${biayasekolahid} not found`);
    }

    await biayaSekolahRef.update({
      isPaid,
      updatedAt: FieldValue.serverTimestamp(),
    });

    res
      .status(200)
      .send(
        `Payment status of BiayaSekolah document with id ${biayasekolahid} updated successfully`
      );
  } catch (error) {
    res
      .status(500)
      .send(
        "Error updating payment status of BiayaSekolah document: " +
          error.message
      );
  }
};

// Get biayasekolah document by biayasekolahid
exports.getBiayaSekolahByBiayaSekolahId = async (req, res) => {
  try {
    const { historysiswaid, biayasekolahid } = req.params;

    const biayaSekolahDoc = await db
      .collection("historysiswa")
      .doc(historysiswaid)
      .collection("biayasekolah")
      .doc(biayasekolahid)
      .get();

    if (!biayaSekolahDoc.exists) {
      return res
        .status(404)
        .send(`BiayaSekolah document with id ${biayasekolahid} not found`);
    }

    const biayaSekolahData = biayaSekolahDoc.data();
    res.status(200).json(biayaSekolahData);
  } catch (error) {
    res
      .status(500)
      .send("Error getting BiayaSekolah document: " + error.message);
  }
};

exports.getHistorySiswaWithBiayaSekolahById = async (req, res) => {
  try {
    const { biayaSekolahId } = req.params;
    const historysiswaRef = await db.collection("historysiswa").get();
    let historysiswa = {};
    for (const doc of historysiswaRef.docs) {
      const data = doc.data();
      data.id = doc.id;
      const biayasekolahRef = await db
        .collection("historysiswa")
        .doc(doc.id)
        .collection("biayasekolah")
        .doc(biayaSekolahId)
        .get();
      historysiswa = biayasekolahRef.data();
    }
    res.status(200).json(historysiswa);
  } catch (error) {
    res
      .status(500)
      .send(
        "Error getting getHistorySiswaWithBiayaSekolahById document: " +
          error.message
      );
  }
};

// Get all biayasekolah documents by historysiswaid
exports.getBiayaSekolahByHistorySiswaId = async (req, res) => {
  try {
    const { historysiswaid } = req.params;

    const biayaSekolahSnapshot = await db
      .collection("historysiswa")
      .doc(historysiswaid)
      .collection("biayasekolah")
      .get();

    if (biayaSekolahSnapshot.empty) {
      return res
        .status(404)
        .send(
          `No BiayaSekolah documents found for historysiswa with id ${historysiswaid}`
        );
    }

    const biayaSekolahList = [];

    biayaSekolahSnapshot.forEach((biayaSekolahDoc) => {
      biayaSekolahList.push(biayaSekolahDoc.data());
    });

    res.status(200).json(biayaSekolahList);
  } catch (error) {
    res
      .status(500)
      .send("Error getting BiayaSekolah documents: " + error.message);
  }
};

// Get all biayasekolah documents by historysiswaid
exports.getAllHistories = async (req, res) => {
  try {
    const historysiswaRef = db.collection("historysiswa");
    const historysiswaSnapshot = await historysiswaRef.get();

    const historysiswa = [];

    for (const doc of historysiswaSnapshot.docs) {
      const data = doc.data();
      data.id = doc.id;

      // Fetch biayasekolah subcollection
      const biayasekolahRef = historysiswaRef
        .doc(doc.id)
        .collection("biayasekolah");
      const biayasekolahSnapshot = await biayasekolahRef.get();

      data.biayasekolah = biayasekolahSnapshot.docs.map((subDoc) => ({
        id: subDoc.id,
        ...subDoc.data(),
      }));

      historysiswa.push(data);
    }

    res.status(200).json(historysiswa);
  } catch (error) {
    res
      .status(500)
      .send("Error getting BiayaSekolah documents: " + error.message);
  }
};

// Get all biayasekolah documents by historysiswaid
exports.getAllHistoriesByNis = async (req, res) => {
  try {
    const { nis } = req.params;
    const historysiswaRef = db.collection("historysiswa");
    const historysiswaSnapshot = await historysiswaRef
      .where("noIndukSiswa", "==", nis)
      .get();

    const historysiswa = [];

    for (const doc of historysiswaSnapshot.docs) {
      const data = doc.data();
      data.id = doc.id;

      // Fetch biayasekolah subcollection
      const biayasekolahRef = historysiswaRef
        .doc(doc.id)
        .collection("biayasekolah");
      const biayasekolahSnapshot = await biayasekolahRef.get();

      data.biayasekolah = biayasekolahSnapshot.docs.map((subDoc) => ({
        id: subDoc.id,
        ...subDoc.data(),
      }));

      historysiswa.push(data);
    }

    res.status(200).json(historysiswa);
  } catch (error) {
    res
      .status(500)
      .send("Error getting BiayaSekolah documents: " + error.message);
  }
};
