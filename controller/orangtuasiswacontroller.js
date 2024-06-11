const { db } = require('../database');

// Edit Orangtua by noinduksiswa
exports.editOrangtuaByNoInduk = async (req, res) => {
  try {
    const noinduksiswa = parseInt(req.params.noinduksiswa, 10);

    if (isNaN(noinduksiswa)) {
      return res.status(400).send('Invalid noinduksiswa');
    }

    const data = req.body;

    const doc = await db.collection('siswa').doc(noinduksiswa.toString()).collection('orangtua').doc('details').get();

    if (!doc.exists) {
      return res.status(404).send('No orangtua found for the given noinduksiswa');
    }

    await db.collection('siswa').doc(noinduksiswa.toString()).collection('orangtua').doc('details').update(data);
    res.status(200).send(`Orangtua for siswa with noinduksiswa: ${noinduksiswa} updated successfully`);
  } catch (error) {
    res.status(500).send('Error updating orangtua: ' + error.message);
  }
};

// Delete Orangtua by noinduksiswa
exports.deleteOrangtuaByNoInduk = async (req, res) => {
  try {
    const noinduksiswa = parseInt(req.params.noinduksiswa, 10);

    if (isNaN(noinduksiswa)) {
      return res.status(400).send('Invalid noinduksiswa');
    }

    const doc = await db.collection('siswa').doc(noinduksiswa.toString()).collection('orangtua').doc('details').get();

    if (!doc.exists) {
      return res.status(404).send('No orangtua found for the given noinduksiswa');
    }

    await db.collection('siswa').doc(noinduksiswa.toString()).collection('orangtua').doc('details').delete();
    res.status(200).send(`Orangtua for siswa with noinduksiswa: ${noinduksiswa} deleted successfully`);
  } catch (error) {
    res.status(500).send('Error deleting orangtua: ' + error.message);
  }
};
