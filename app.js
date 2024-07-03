const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dayjs = require("dayjs");
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
  loginOrangTua,
  decodeToken,
  loginAdmin,
  deleteSiswa,
} = require("./controller/siswacontroller.js");
const {
  addHistorySiswa,
  updateHistorySiswa,
  getSiswaPromotedOnKelas,
  getAllHistorySiswaByNoIndukSiswa,
} = require("./controller/historysiswacontroller.js");
const {
  updateBiayaSekolah,
  updatePaymentStatus,
  getBiayaSekolahByBiayaSekolahId,
  getBiayaSekolahByHistorySiswaId,
  getAllHistories,
  getHistorySiswaWithBiayaSekolahById,
} = require("./controller/biayasekolahcontroller.js");
const {
  editOrangtuaByNoInduk,
  deleteOrangtuaByNoInduk,
} = require("./controller/orangtuasiswacontroller.js");
const {
  generateSingleTagihan,
  generateMultipleTagihan,
} = require("./controller/tagihanbayarcontroller.js");
const paymentHistoryController = require("./controller/paymenthistory.js");
const {
  isAdmin,
  isSiswa,
  isParent,
  authenticateToken,
} = require("./controller/middleware/auth.js");
const { gender } = require("./controller/statisticcontroller.js");
const { db } = require("./database.js");
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
  })
);

app.post("/create-siswa", createSiswa);
app.post("/login-siswa", loginSiswa);
app.post("/login-orangtua", loginOrangTua);
app.post("/login-admin", loginAdmin);

// Protected routes
app.put("/update-siswa/:noinduksiswa", editSiswaByNoInduk);
app.delete("/siswa/:noinduksiswa", deleteSiswaByNoInduk);
app.patch("/promote-siswa", isAdmin, promoteSelectedSiswa);
app.delete("/delete-siswa/:noinduksiswa", isAdmin, deleteSiswaByNoInduk);
app.get("/filter-siswa", authenticateToken, filterSiswa);
app.get("/search-siswa/:noinduksiswa", authenticateToken, searchByNoIndukSiswa);
app.get("/decodeToken", authenticateToken, decodeToken);

// Routes for Orangtua operations
app.put("/siswa/:noinduksiswa/orangtua", editOrangtuaByNoInduk);
app.delete("/siswa/:noinduksiswa/orangtua", deleteOrangtuaByNoInduk);
// Routes for HistorySiswa operations
app.post("/historysiswa", addHistorySiswa); // Add a history siswa record
app.get("/historysiswa", getAllHistories); // Add a history siswa record
app.put("/historysiswa/:historysiswaid", updateHistorySiswa); // Update a history siswa record
app.get("/historysiswa/promoted/:kelas", getSiswaPromotedOnKelas); // Get siswa promoted on a specific kelas
app.get("/historysiswa/:noinduksiswa", getAllHistorySiswaByNoIndukSiswa); // Get all history siswa records by noinduksiswa
app.get("/payments/:biayaSekolahId", getHistorySiswaWithBiayaSekolahById); // Get all history siswa records by noinduksiswa
// routes for biayasekolah operations
app.put(
  "/update-info-pembayaran/:historysiswaid/:biayasekolahid",
  updateBiayaSekolah
);
app.put(
  "/verifikasi-pembayaran/:historysiswaid/:biayasekolahid",
  updatePaymentStatus
);
app.get(
  "/cek-tagihan/:historysiswaid/:biayasekolahid",
  getBiayaSekolahByBiayaSekolahId
);
app.get(
  "/cek-history-pembayaran/:historysiswaid",
  getBiayaSekolahByHistorySiswaId
);
app.get("/cek-history-pembayaran", getAllHistories);
// routes for tagihanbayar operations
app.post("/generateSingleTagihan/:biayasekolahid", generateSingleTagihan);
app.post("/generateMultipleTagihan", generateMultipleTagihan);
// payment history
app.post(
  "/generate-payment/:biayasekolahid",
  paymentHistoryController.uploadBuktiFoto,
  paymentHistoryController.generatePaymentHistory
);
app.patch(
  "/approve-payment/:paymentid",
  paymentHistoryController.approvePayment
);
app.patch("/reject-payment/:paymentid", paymentHistoryController.rejectPayment);

// Basic route to test the connection
app.get("/just-parent", authenticateToken, isParent, (req, res) => {
  res.send("Hello World!");
});

app.get("/just-admin", authenticateToken, isAdmin, (req, res) => {
  res.send("Hello World!");
});

app.get("/just-siswa", authenticateToken, isSiswa, (req, res) => {
  res.send("Hello World!");
});

app.get("/statistic/gender", gender);
app.get("/current-and-next-month-payments/:nis", async (req, res) => {
  try {
    const nis = req.params.nis;
    const currentDate = dayjs();
    const currentMonth = currentDate.month() + 1; // month() is 0-indexed
    const nextMonth = currentDate.add(1, "month").month() + 1;
    const currentYear = currentDate.year();

    // Calculate document IDs for the current and next month
    const basePath = `/historysiswa/${nis}-2024-2025/biayasekolah/`;
    const currentMonthDoc = `${basePath}tagihan${nis}-2024-2025-${currentMonth}`;

    const nextMonthDoc = `${basePath}tagihan${nis}-2024-2025-${nextMonth}`;

    const currentMonthSnapshot = await db.doc(currentMonthDoc).get();
    const nextMonthSnapshot = await db.doc(nextMonthDoc).get();

    // Calculate total biaya for current month
    const currentMonthData = currentMonthSnapshot.exists
      ? currentMonthSnapshot.data()
      : null;
    const nextMonthData = nextMonthSnapshot.exists
      ? nextMonthSnapshot.data()
      : null;

    const calculateTotalBiaya = (data) => {
      if (!data) return 0;
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(
        parseInt(data.biayaKegiatanLain) +
          parseInt(data.biayaBuku) +
          parseInt(data.biayaSaranaSekolah) +
          parseInt(data.biayaEkskul) +
          parseInt(data.biayaSeragam) +
          parseInt(data.biayaSPP) +
          parseInt(data.biayaStudyTour)
      );
    };

    const currentMonthTotal = calculateTotalBiaya(currentMonthData);
    const nextMonthTotal = calculateTotalBiaya(nextMonthData);

    // Add month name and year to the data
    const addMonthYear = (data, month, year) => {
      if (!data) return null;
      return {
        ...data,
        monthName: dayjs()
          .month(month - 1)
          .format("MMMM"),
        year,
      };
    };

    const currentMonthResult = addMonthYear(
      currentMonthData,
      currentMonth,
      currentYear
    );
    const nextMonthResult = addMonthYear(nextMonthData, nextMonth, currentYear);

    // Fetch all next month's data to the end of the year
    const nextMonthDocs = [];
    for (let i = nextMonth; i <= 12; i++) {
      const docId = `${basePath}tagihan1000-2024-2025-${i}`;
      const docSnapshot = await db.doc(docId).get();
      if (docSnapshot.exists) {
        nextMonthDocs.push(addMonthYear(docSnapshot.data(), i, currentYear));
      }
    }

    res.json({
      currentMonth: {
        data: currentMonthResult,
        totalBiaya: currentMonthTotal,
      },
      nextMonth: {
        data: nextMonthResult,
        totalBiaya: nextMonthTotal,
        remainingMonths: nextMonthDocs,
      },
    });
  } catch (error) {
    console.error("Error fetching monthly payments:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
