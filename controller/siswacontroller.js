const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { db } = require("../database");
const { v4: uuidv4 } = require("uuid");
const config = require("../config");
const { getTokenFromHeaders } = require("../utils");
const secretKey = config.jwt.secret; // Move this to your config file or environment variable

// Function to get the next noinduksiswa
const getNextNoIndukSiswa = async () => {
  const siswaCollection = db.collection("siswa");
  const snapshot = await siswaCollection
    .orderBy("noinduksiswa", "desc")
    .limit(1)
    .get();

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
    const tglregestrasi = new Date().toISOString().split("T")[0];
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
      email,
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
      jeniskelamin,
      emailOrtu,
    } = req.body;

    // Validate required fields
    if (
      !nama_siswa ||
      !tempat_lahir ||
      !tanggal_lahir ||
      !agama ||
      !alamat ||
      !jeniskelamin ||
      !kelurahan ||
      !kecamatan ||
      !kota ||
      !kodepos ||
      !notelepon ||
      !namaayah ||
      !pekerjaanayah ||
      !pendidikanayah ||
      !penghasilanayah ||
      !namaibu ||
      !pekerjaanibu ||
      !pendidikanibu ||
      !penghasilanibu ||
      !email
    ) {
      return res.status(400).send("Missing required fields");
    }

    const hashedPassword = await bcrypt.hash(noinduksiswa.toString(), 10);
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
      jeniskelamin,
      kota,
      kodepos,
      notelepon,
      email,
      password: hashedPassword,
      isAdmin: false,
      isSiswa: true,
      isParent: false,
    };

    await db.collection("siswa").doc(noinduksiswa.toString()).set(siswa);

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
      emailOrtu,
      username: `${noinduksiswa}ortu`,
      password: hashedPassword, // Same hashed password as siswa
      totalpenghasilan: parseInt(penghasilanayah) + parseInt(penghasilanibu),
      isAdmin: false,
      isParent: true,
      isSiswa: false,
    };

    await db
      .collection("siswa")
      .doc(noinduksiswa.toString())
      .collection("orangtua")
      .doc("details")
      .set(orangtua);

    res
      .status(200)
      .send(`Siswa and orangtua added with noinduksiswa: ${noinduksiswa}`);
  } catch (error) {
    res.status(500).send("Error creating siswa: " + error.message);
  }
};

// Helper function to generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, secretKey, { expiresIn: "1h" });
};

// Login Siswa
exports.loginSiswa = async (req, res) => {
  try {
    const { noinduksiswa, password } = req.body;

    if (!noinduksiswa || !password) {
      return res.status(400).send("Noinduksiswa and password are required");
    }

    const doc = await db.collection("siswa").doc(noinduksiswa.toString()).get();

    if (!doc.exists) {
      return res.status(404).send("No siswa found with the given noinduksiswa");
    }

    const siswa = doc.data();

    const isPasswordValid = await bcrypt.compare(password, siswa.password);

    if (!isPasswordValid) {
      return res.status(401).send("Invalid password");
    }

    const token = generateToken({
      noinduksiswa: siswa.noinduksiswa,
      nama_siswa: siswa.nama_siswa,
      isAdmin: siswa.isAdmin,
      isSiswa: siswa.isSiswa,
      isParent: siswa.isParent,
    });

    res.cookie("token", token, { httpOnly: true });
    res.status(200).json({ token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Error logging in: " + error.message);
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!password) {
      return res.status(400).send("Password is required");
    }

    if (username !== "admin" || password !== "admin") {
      return res.status(401).send("Invalid username or password");
    }

    const data = {
      username: "Admin",
      role: "admin",
      scope: "full",
    };

    const token = generateToken(data);

    res.cookie("token", token, { httpOnly: true });
    return res.status(200).json({ token, data });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Error logging in: " + error.message);
  }
};

// Login Orangtua
exports.loginOrangTua = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send("Username and password are required");
    }

    const noinduksiswa = username.split("ortu")[0];

    const docRef = db
      .collection("siswa")
      .doc(noinduksiswa)
      .collection("orangtua")
      .doc("details");
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).send("No orangtua found with the given username");
    }

    const orangtua = doc.data();

    const isPasswordValid = await bcrypt.compare(password, orangtua.password);

    if (!isPasswordValid) {
      return res.status(401).send("Invalid password");
    }

    const token = generateToken({
      noinduksiswa,
      nama_siswa: orangtua.nama_siswa,
      isAdmin: orangtua.isAdmin,
      isParent: orangtua.isParent,
      isSiswa: orangtua.isSiswa,
    });

    res.cookie("token", token, { httpOnly: true });
    res.status(200).json({ token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Error logging in");
  }
};

// Promote selected Siswa to the next grade
exports.promoteSelectedSiswa = async (req, res) => {
  try {
    const { noinduksiswaList } = req.body;

    if (!Array.isArray(noinduksiswaList) || noinduksiswaList.length === 0) {
      return res
        .status(400)
        .send("Invalid request: noinduksiswaList must be a non-empty array");
    }

    const batch = db.batch();

    const promises = noinduksiswaList.map(async (noinduksiswa) => {
      const docRef = db.collection("siswa").doc(noinduksiswa.toString());
      const doc = await docRef.get();

      if (!doc.exists) {
        return res
          .status(404)
          .send(`Siswa with noinduksiswa ${noinduksiswa} not found`);
      }

      const data = doc.data();
      const newKelas = data.kelas + 1;
      const currentYear = parseInt(data.tahunAjaranSekarang.split("-")[0], 10);
      const newTahunAjaranSekarang = `${currentYear + 1}-${currentYear + 2}`;

      batch.update(docRef, {
        kelas: newKelas,
        tahunAjaranSekarang: newTahunAjaranSekarang,
      });
    });

    await Promise.all(promises);
    await batch.commit();
    res.status(200).send("Selected siswa promoted to the next grade");
  } catch (error) {
    res.status(500).send("Error promoting selected siswa: " + error.message);
  }
};

// Edit Siswa by noinduksiswa
exports.editSiswaByNoInduk = async (req, res) => {
  try {
    const noinduksiswa = parseInt(req.params.noinduksiswa, 10);

    if (isNaN(noinduksiswa)) {
      return res.status(400).send("Invalid noinduksiswa");
    }

    const data = req.body;

    const doc = await db.collection("siswa").doc(noinduksiswa.toString()).get();

    if (!doc.exists) {
      return res.status(404).send("No siswa found with the given noinduksiswa");
    }

    await db.collection("siswa").doc(noinduksiswa.toString()).update(data);
    res
      .status(200)
      .send(`Siswa with noinduksiswa: ${noinduksiswa} updated successfully`);
  } catch (error) {
    res.status(500).send("Error updating siswa: " + error.message);
  }
};

exports.deleteSiswa = async (req, res) => {
  try {
    const nis = parseInt(req.params.nis, 10);

    if (isNaN(nis)) {
      return res.status(400).send("Invalid noinduksiswa");
    }

    const doc = await db.collection("siswa").doc(noinduksiswa.toString()).get();

    if (!doc.exists) {
      return res.status(404).send("No siswa found with the given noinduksiswa");
    }

    await db.collection("siswa").doc(noinduksiswa.toString()).delete();
    res
      .status(200)
      .send(`Siswa with noinduksiswa: ${noinduksiswa} delete successfully`);
  } catch (error) {
    res.status(500).send("Error updating siswa: " + error.message);
  }
};

// Delete Siswa by noinduksiswa
exports.deleteSiswaByNoInduk = async (req, res) => {
  try {
    const noinduksiswa = parseInt(req.params.noinduksiswa, 10);

    if (isNaN(noinduksiswa)) {
      return res.status(400).send("Invalid noinduksiswa");
    }

    const doc = await db.collection("siswa").doc(noinduksiswa.toString()).get();

    if (!doc.exists) {
      return res.status(404).send("No siswa found with the given noinduksiswa");
    }

    await db.collection("siswa").doc(noinduksiswa.toString()).delete();
    res
      .status(200)
      .send(`Siswa with noinduksiswa: ${noinduksiswa} deleted successfully`);
  } catch (error) {
    res.status(500).send("Error deleting siswa: " + error.message);
  }
};

// Filter Siswa
exports.filterSiswa = async (req, res) => {
  try {
    const filters = req.query; // Use query parameters for filtering
    let query = db.collection("siswa");

    Object.keys(filters).forEach((key) => {
      query = query.where(key, "==", filters[key]);
    });

    const snapshot = await query.get();
    const documents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).send("Error filtering siswa: " + error.message);
  }
};

// Search Siswa by noinduksiswa
exports.searchByNoIndukSiswa = async (req, res) => {
  try {
    const noinduksiswa = parseInt(req.params.noinduksiswa, 10);

    if (isNaN(noinduksiswa)) {
      return res.status(400).send("Invalid noinduksiswa");
    }

    const doc = await db.collection("siswa").doc(noinduksiswa.toString()).get();

    if (!doc.exists) {
      return res.status(404).send("No siswa found with the given noinduksiswa");
    }

    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).send("Error searching siswa: " + error.message);
  }
};

// decode payload
exports.decodeToken = (req, res) => {
  try {
    const token = getTokenFromHeaders(req.headers);
    if (!token) {
      return res.status(401).send("No token found");
    }

    // Verify and decode the token
    jwt.verify(token, secretKey, (err, decoded) => {
      // Replace 'your_secret_key'
      if (err) {
        return res.status(403).send("Invalid token");
      }

      // Send the decoded payload as the response
      res.status(200).json(decoded);
    });
  } catch (error) {
    console.error("Error decoding token:", error);
    res.status(500).send("Error decoding token");
  }
};

// // Promote selected Siswa to the next grade
// exports.promoteSelectedSiswa = async (req, res) => {
//     try {
//       const { noinduksiswaList } = req.body;

//       if (!Array.isArray(noinduksiswaList) || noinduksiswaList.length === 0) {
//         return res.status(400).send('Invalid request: noinduksiswaList must be a non-empty array');
//       }

//       const batch = db.batch();

//       const promises = noinduksiswaList.map(async (noinduksiswa) => {
//         const docRef = db.collection('siswa').doc(noinduksiswa.toString());
//         const doc = await docRef.get();

//         if (!doc.exists) {
//           return res.status(404).send(`Siswa with noinduksiswa ${noinduksiswa} not found`);
//         }

//         const data = doc.data();
//         const newKelas = data.kelas + 1;
//         const currentYear = parseInt(data.tahunAjaranSekarang.split('-')[0], 10);
//         const newTahunAjaranSekarang = `${currentYear + 1}-${currentYear + 2}`;

//         batch.update(docRef, {
//           kelas: newKelas,
//           tahunAjaranSekarang: newTahunAjaranSekarang
//         });
//       });

//       await Promise.all(promises);
//       await batch.commit();
//       res.status(200).send('Selected siswa promoted to the next grade');
//     } catch (error) {
//       res.status(500).send('Error promoting selected siswa: ' + error.message);
//     }
//   };

// // Edit Siswa by noinduksiswa
// exports.editSiswaByNoInduk = async (req, res) => {
//   try {
//     const noinduksiswa = parseInt(req.params.noinduksiswa, 10);

//     if (isNaN(noinduksiswa)) {
//       return res.status(400).send('Invalid noinduksiswa');
//     }

//     const data = req.body;

//     const doc = await db.collection('siswa').doc(noinduksiswa.toString()).get();

//     if (!doc.exists) {
//       return res.status(404).send('No siswa found with the given noinduksiswa');
//     }

//     await db.collection('siswa').doc(noinduksiswa.toString()).update(data);
//     res.status(200).send(`Siswa with noinduksiswa: ${noinduksiswa} updated successfully`);
//   } catch (error) {
//     res.status(500).send('Error updating siswa: ' + error.message);
//   }
// };

// // Delete Siswa by noinduksiswa
// exports.deleteSiswaByNoInduk = async (req, res) => {
//   try {
//     const noinduksiswa = parseInt(req.params.noinduksiswa, 10);

//     if (isNaN(noinduksiswa)) {
//       return res.status(400).send('Invalid noinduksiswa');
//     }

//     const doc = await db.collection('siswa').doc(noinduksiswa.toString()).get();

//     if (!doc.exists) {
//       return res.status(404).send('No siswa found with the given noinduksiswa');
//     }

//     await db.collection('siswa').doc(noinduksiswa.toString()).delete();
//     res.status(200).send(`Siswa with noinduksiswa: ${noinduksiswa} deleted successfully`);
//   } catch (error) {
//     res.status(500).send('Error deleting siswa: ' + error.message);
//   }
// };

// // Filter Siswa
// exports.filterSiswa = async (req, res) => {
//   try {
//     const filters = req.query; // Use query parameters for filtering
//     let query = db.collection('siswa');

//     Object.keys(filters).forEach(key => {
//       query = query.where(key, '==', filters[key]);
//     });

//     const snapshot = await query.get();
//     const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//     res.status(200).json(documents);
//   } catch (error) {
//     res.status(500).send('Error filtering siswa: ' + error.message);
//   }
// };

// // Search Siswa by noinduksiswa
// exports.searchByNoIndukSiswa = async (req, res) => {
//   try {
//     const noinduksiswa = parseInt(req.params.noinduksiswa, 10);

//     if (isNaN(noinduksiswa)) {
//       return res.status(400).send('Invalid noinduksiswa');
//     }

//     const doc = await db.collection('siswa').doc(noinduksiswa.toString()).get();

//     if (!doc.exists) {
//       return res.status(404).send('No siswa found with the given noinduksiswa');
//     }

//     res.status(200).json({ id: doc.id, ...doc.data() });
//   } catch (error) {
//     res.status(500).send('Error searching siswa: ' + error.message);
//   }
// };
