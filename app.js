const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3002;
const {
    createSiswa,
    editSiswaByNoInduk,
    deleteSiswaByNoInduk,
    filterSiswa,
    searchByNoIndukSiswa,
    promoteSelectedSiswa,
    loginSiswa,
    loginOrangTua
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
const { isAdmin, isSiswa, isParent, authenticateJWT } = require('./controller/middleware/auth.js');
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
app.use(cors());


app.post('/create-siswa', createSiswa);
app.post('/login-siswa', loginSiswa);
app.post('/login-orangtua', loginOrangTua);

// Protected routes
app.patch('/update-siswa/:noinduksiswa', isSiswa, editSiswaByNoInduk);
app.patch('/promote-siswa', isAdmin, promoteSelectedSiswa);
app.delete('/delete-siswa/:noinduksiswa', isAdmin, deleteSiswaByNoInduk);
app.get('/filter-siswa', authenticateJWT, filterSiswa);
app.get('/search-siswa/:noinduksiswa', authenticateJWT, searchByNoIndukSiswa);

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
app.patch('/approve-payment/:paymentid', paymentHistoryController.approvePayment);
app.patch('/reject-payment/:paymentid', paymentHistoryController.rejectPayment);




// Basic route to test the connection
app.get('/just-parent', authenticateJWT, isParent, (req, res) => {
  res.send('Hello World!');
});

app.get('/just-admin', authenticateJWT, isAdmin, (req, res) => {
  res.send('Hello World!');
});

app.get('/just-siswa', authenticateJWT, isSiswa, (req, res) => {
  res.send('Hello World!');
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
