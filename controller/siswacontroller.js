const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');

// Function to get the next noinduksiswa
const getNextNoIndukSiswa = async () => {
  const siswaCollection = db.collection('siswa');
  const snapshot = await siswaCollection.orderBy('noinduksiswa', 'desc').limit(1).get();

  if (snapshot.empty) {
    return 1000; // Starting point if no documents exist
  }

  const lastSiswa = snapshot.docs[0].data();
  return lastSiswa.noinduksiswa + 1;
};

// Function to calculate the current academic year
const getCurrentAcademicYear = () => {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
};

// Create Siswa
exports.createSiswa = async (req, res) => {
  try {
    const noinduksiswa = await getNextNoIndukSiswa();
    const noregsiswa = uuidv4();
    const tglregestrasi = new Date().toISOString().split('T')[0];
    const tahunAjaranSekarang = getCurrentAcademicYear();
    const tahunajaran = tahunAjaranSekarang; // Initial academic year
    const kelas = 7; // Default grade

    const {
      nama_siswa,
      tempat_lahir,
      tanggal_lahir,
      agama,
      alamat,
      kelurahan,
      kecamatan,
      kota,
      kodepos,
      notelepon,
      namaayah,
      pekerjaanayah,
      pendidikanayah,
      penghasilanayah,
      namaibu,
      pekerjaanibu,
      pendidikanibu,
      penghasilanibu,
      namawali,
      noteleponwali
    } = req.body;

    // Validate required fields
    if (!nama_siswa || !tempat_lahir || !tanggal_lahir || !agama || !alamat || !kelurahan || !kecamatan || !kota || !kodepos || !notelepon ||
        !namaayah || !pekerjaanayah || !pendidikanayah || !penghasilanayah || !namaibu || !pekerjaanibu || !pendidikanibu || !penghasilanibu) {
      return res.status(400).send('Missing required fields');
    }

    const siswa = {
      noinduksiswa,
      noregsiswa,
      tglregestrasi,
      tahunajaran,
      tahunAjaranSekarang,
      kelas,
      nama_siswa,
      tempat_lahir,
      tanggal_lahir,
      agama,
      alamat,
      kelurahan,
      kecamatan,
      kota,
      kodepos,
      notelepon
    };

    await db.collection('siswa').doc(noinduksiswa.toString()).set(siswa);

    const orangtua = {
      namaayah,
      pekerjaanayah,
      pendidikanayah,
      penghasilanayah,
      namaibu,
      pekerjaanibu,
      pendidikanibu,
      penghasilanibu,
      namawali,
      noteleponwali,
      totalpenghasilan: parseInt(penghasilanayah) + parseInt(penghasilanibu)
    };

    await db.collection('siswa').doc(noinduksiswa.toString()).collection('orangtua').doc('details').set(orangtua);

    res.status(200).send(`Siswa and orangtua added with noinduksiswa: ${noinduksiswa}`);
  } catch (error) {
    res.status(500).send('Error creating siswa: ' + error.message);
  }
};

// Promote selected Siswa to the next grade
exports.promoteSelectedSiswa = async (req, res) => {
    try {
      const { noinduksiswaList } = req.body;
  
      if (!Array.isArray(noinduksiswaList) || noinduksiswaList.length === 0) {
        return res.status(400).send('Invalid request: noinduksiswaList must be a non-empty array');
      }
  
      const batch = db.batch();
  
      const promises = noinduksiswaList.map(async (noinduksiswa) => {
        const docRef = db.collection('siswa').doc(noinduksiswa.toString());
        const doc = await docRef.get();
  
        if (!doc.exists) {
          return res.status(404).send(`Siswa with noinduksiswa ${noinduksiswa} not found`);
        }
  
        const data = doc.data();
        const newKelas = data.kelas + 1;
        const currentYear = parseInt(data.tahunAjaranSekarang.split('-')[0], 10);
        const newTahunAjaranSekarang = `${currentYear + 1}-${currentYear + 2}`;
  
        batch.update(docRef, {
          kelas: newKelas,
          tahunAjaranSekarang: newTahunAjaranSekarang
        });
      });
  
      await Promise.all(promises);
      await batch.commit();
      res.status(200).send('Selected siswa promoted to the next grade');
    } catch (error) {
      res.status(500).send('Error promoting selected siswa: ' + error.message);
    }
  };
// Other functions (edit, delete, filter, search) remain unchanged

  
  // Other functions (edit, delete, filter, search) remain unchanged
  

// Edit Siswa by noinduksiswa
exports.editSiswaByNoInduk = async (req, res) => {
  try {
    const noinduksiswa = parseInt(req.params.noinduksiswa, 10);

    if (isNaN(noinduksiswa)) {
      return res.status(400).send('Invalid noinduksiswa');
    }

    const data = req.body;

    const doc = await db.collection('siswa').doc(noinduksiswa.toString()).get();

    if (!doc.exists) {
      return res.status(404).send('No siswa found with the given noinduksiswa');
    }

    await db.collection('siswa').doc(noinduksiswa.toString()).update(data);
    res.status(200).send(`Siswa with noinduksiswa: ${noinduksiswa} updated successfully`);
  } catch (error) {
    res.status(500).send('Error updating siswa: ' + error.message);
  }
};

// Delete Siswa by noinduksiswa
exports.deleteSiswaByNoInduk = async (req, res) => {
  try {
    const noinduksiswa = parseInt(req.params.noinduksiswa, 10);

    if (isNaN(noinduksiswa)) {
      return res.status(400).send('Invalid noinduksiswa');
    }

    const doc = await db.collection('siswa').doc(noinduksiswa.toString()).get();

    if (!doc.exists) {
      return res.status(404).send('No siswa found with the given noinduksiswa');
    }

    await db.collection('siswa').doc(noinduksiswa.toString()).delete();
    res.status(200).send(`Siswa with noinduksiswa: ${noinduksiswa} deleted successfully`);
  } catch (error) {
    res.status(500).send('Error deleting siswa: ' + error.message);
  }
};

// Filter Siswa
exports.filterSiswa = async (req, res) => {
  try {
    const filters = req.query; // Use query parameters for filtering
    let query = db.collection('siswa');

    Object.keys(filters).forEach(key => {
      query = query.where(key, '==', filters[key]);
    });

    const snapshot = await query.get();
    const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).send('Error filtering siswa: ' + error.message);
  }
};

// Search Siswa by noinduksiswa
exports.searchByNoIndukSiswa = async (req, res) => {
  try {
    const noinduksiswa = parseInt(req.params.noinduksiswa, 10);

    if (isNaN(noinduksiswa)) {
      return res.status(400).send('Invalid noinduksiswa');
    }

    const doc = await db.collection('siswa').doc(noinduksiswa.toString()).get();

    if (!doc.exists) {
      return res.status(404).send('No siswa found with the given noinduksiswa');
    }

    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).send('Error searching siswa: ' + error.message);
  }
};
