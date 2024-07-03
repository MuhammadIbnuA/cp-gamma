const { db } = require("../database");
const { FieldValue } = require("firebase-admin").firestore;

// Add a history siswa record
// Add a history siswa record
exports.addHistorySiswa = async (req, res) => {
  try {
    const {
      noinduksiswa,
      rataNilaiUTS = 0,
      rataNilaiUAS = 0,
      keterangan = "data terbuat",
    } = req.body;

    // Fetch siswa data
    const siswaDoc = await db.collection("siswa").doc(noinduksiswa).get();
    if (!siswaDoc.exists) {
      return res
        .status(404)
        .send(`Siswa with noinduksiswa ${noinduksiswa} not found`);
    }
    const siswaData = siswaDoc.data();
    const { tahunAjaranSekarang, kelas } = siswaData;

    // Construct historysiswaid
    const historysiswaid = `${noinduksiswa}-${tahunAjaranSekarang}`;

    // Construct history siswa data
    const historySiswaData = {
      historysiswaid,
      noinduksiswa,
      tahunAjaranSekarang,
      kelas,
      rataNilaiUTS,
      rataNilaiUAS,
      keterangan,
      ispromoted: calculateIsPromoted(rataNilaiUTS, rataNilaiUAS),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Add history siswa record to Firestore
    await db
      .collection("historysiswa")
      .doc(historysiswaid)
      .set(historySiswaData);

    // Generate biayaSekolah records for the year
    const currentMonth = new Date().getMonth(); // Get current month index
    const batch = db.batch();
    for (let i = 0; i < 12; i++) {
      const monthIndex = ((currentMonth + i) % 12) + 1; // Cycle through months, starting from current month
      const biayaSekolahId = `tagihan${noinduksiswa}-${tahunAjaranSekarang}-${monthIndex}`;
      const biayaSekolahData = {
        sortNumber: monthIndex,
        biayaSekolahId,
        historysiswaid,
        noinduksiswa,
        tahunAjaranSekarang,
        kelas,
        biayaSaranaSekolah: 0,
        biayaBuku: 0,
        biayaSeragam: 0,
        biayaEkskul: 0,
        biayaKegiatanLain: 0,
        biayaStudyTour: 0,
        biayaSPP: 0, // Default biayaSPP value
        totalBiaya: 0, // Default totalBiaya value
        isPaid: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      const biayaSekolahRef = db
        .collection("historysiswa")
        .doc(historysiswaid)
        .collection("biayasekolah")
        .doc(biayaSekolahId);
      batch.set(biayaSekolahRef, biayaSekolahData);
    }
    await batch.commit();

    res
      .status(200)
      .send(`HistorySiswa record added with id: ${historysiswaid}`);
  } catch (error) {
    res.status(500).send("Error adding HistorySiswa record: " + error.message);
  }
};

// Function to calculate ispromoted
function calculateIsPromoted(rataNilaiUTS, rataNilaiUAS) {
  const rataRataTotal = 0.4 * rataNilaiUTS + 0.6 * rataNilaiUAS;
  return rataRataTotal >= 65;
}

// Update a history siswa record
exports.updateHistorySiswa = async (req, res) => {
  try {
    const { historysiswaid } = req.params;
    const { keterangan } = req.body;

    const historySiswaRef = db.collection("historysiswa").doc(historysiswaid);
    const historySiswaDoc = await historySiswaRef.get();

    if (!historySiswaDoc.exists) {
      return res
        .status(404)
        .send(`HistorySiswa record with id ${historysiswaid} not found`);
    }

    await historySiswaRef.update({ keterangan });

    res
      .status(200)
      .send(
        `HistorySiswa record with id ${historysiswaid} updated successfully`
      );
  } catch (error) {
    res
      .status(500)
      .send("Error updating HistorySiswa record: " + error.message);
  }
};

// Get siswa who are promoted in a specific kelas
exports.getSiswaPromotedOnKelas = async (req, res) => {
  try {
    const { kelas } = req.params;

    const snapshot = await db
      .collection("historysiswa")
      .where("kelas", "==", parseInt(kelas))
      .where("ispromoted", "==", true)
      .get();

    const siswaPromoted = snapshot.docs.map((doc) => doc.data().noinduksiswa);

    res.status(200).send(siswaPromoted);
  } catch (error) {
    res
      .status(500)
      .send("Error getting siswa promoted on kelas: " + error.message);
  }
};

// Get all history siswa records by noinduksiswa
exports.getAllHistorySiswaByNoIndukSiswa = async (req, res) => {
  try {
    const { noinduksiswa } = req.params;

    const snapshot = await db
      .collection("historysiswa")
      .where("noinduksiswa", "==", noinduksiswa)
      .get();

    const historySiswaList = snapshot.docs.map((doc) => doc.data());

    res.status(200).send(historySiswaList);
  } catch (error) {
    res
      .status(500)
      .send("Error getting all history siswa records: " + error.message);
  }
};
