const { db } = require("../database");

exports.gender = async (req, res) => {
  try {
    const siswaSnapshot = await db.collection("siswa").get();
    const genderCounts = {
      "Laki-laki": 0,
      Perempuan: 0,
    };

    siswaSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.jeniskelamin === "Laki-laki") {
        genderCounts["Laki-laki"]++;
      } else if (data.jeniskelamin === "Perempuan") {
        genderCounts["Perempuan"]++;
      }
    });

    return res.json(genderCounts);
  } catch (error) {
    console.error("Error fetching gender statistics:", error);
    res.status(500).send("Internal Server Error");
  }
};
