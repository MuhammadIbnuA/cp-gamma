const express = require('express');
const { db, bucket } = require('./database.js'); // Import Firestore and storage bucket from firebase.js
const cors = require('cors')
const app = express();
const port = 3002;
const {
    createSiswa,
    editSiswaByNoInduk,
    deleteSiswaByNoInduk,
    filterSiswa,
    searchByNoIndukSiswa,
    promoteSelectedSiswa
  } = require('./controller/siswacontroller.js');
const {
    addHistorySiswa,
    updateHistorySiswa,
    getSiswaPromotedOnKelas,
    getAllHistorySiswaByNoIndukSiswa
  } = require('./controller/historysiswacontroller.js');
const {
  updateBiayaSekolah,
  updatePaymentStatus,
  getBiayaSekolahByBiayaSekolahId,
  getBiayaSekolahByHistorySiswaId
} = require('./controller/biayasekolahcontroller.js');
const { editOrangtuaByNoInduk, deleteOrangtuaByNoInduk } = require('./controller/orangtuasiswacontroller.js');
const { generateSingleTagihan, generateMultipleTagihan } = require('./controller/tagihanbayarcontroller.js');
const paymentHistoryController = require('./controller/paymenthistory.js');

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());


// Routes for Siswa operations
app.post('/siswa', createSiswa);
app.put('/siswa/:noinduksiswa', editSiswaByNoInduk);
app.delete('/siswa/:noinduksiswa', deleteSiswaByNoInduk);
app.get('/siswa', filterSiswa); // Use query parameters for filtering
app.get('/siswa/search/:noinduksiswa', searchByNoIndukSiswa); // Search by noinduksiswa
app.post('/siswa/promote', promoteSelectedSiswa); // Promote siswa grade
// Routes for Orangtua operations
app.put('/siswa/:noinduksiswa/orangtua', editOrangtuaByNoInduk);
app.delete('/siswa/:noinduksiswa/orangtua', deleteOrangtuaByNoInduk);
// Routes for HistorySiswa operations
app.post('/historysiswa', addHistorySiswa); // Add a history siswa record
app.put('/historysiswa/:historysiswaid', updateHistorySiswa); // Update a history siswa record
app.get('/historysiswa/promoted/:kelas', getSiswaPromotedOnKelas); // Get siswa promoted on a specific kelas
app.get('/historysiswa/:noinduksiswa', getAllHistorySiswaByNoIndukSiswa); // Get all history siswa records by noinduksiswa
// routes for biayasekolah operations
app.put('/update-info-pembayaran/:historysiswaid/:biayasekolahid', updateBiayaSekolah);
app.put('/verifikasi-pembayaran/:historysiswaid/:biayasekolahid', updatePaymentStatus);
app.get('/cek-tagihan/:historysiswaid/:biayasekolahid',getBiayaSekolahByBiayaSekolahId);
app.get('/cek-history-pembayaran/:historysiswaid',getBiayaSekolahByHistorySiswaId);
// routes for tagihanbayar operations
app.post('/generateSingleTagihan/:biayasekolahid', generateSingleTagihan);
app.post('/generateMultipleTagihan', generateMultipleTagihan);
// payment history
app.post('/generate-payment/:biayasekolahid', paymentHistoryController.uploadBuktiFoto, paymentHistoryController.generatePaymentHistory);
// app.patch('/approve-payment/:paymentid', paymentHistoryController.approvePayment);
// app.patch('/reject-payment/:paymentid', paymentHistoryController.rejectPayment);




// Basic route to test the connection
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
