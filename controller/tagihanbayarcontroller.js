const { db } = require('../database');
const { FieldValue } = require('firebase-admin').firestore;

// Function to generate 4 random digits
const generateRandomDigits = () => Math.floor(1000 + Math.random() * 9000);

// Generate a single tagihan
exports.generateSingleTagihan = async (req, res) => {
    try {
        const { biayasekolahid } = req.params;

        // Extract historysiswaid from biayasekolahid
        const historysiswaidParts = biayasekolahid.split('tagihan')[1].split('-');
        const historysiswaid = historysiswaidParts.slice(0, 3).join('-');

        const biayaSekolahRef = db.collection('historysiswa').doc(historysiswaid).collection('biayasekolah').doc(biayasekolahid);
        const biayaSekolahDoc = await biayaSekolahRef.get();
        console.log(historysiswaid)
        console.log(historysiswaidParts)

        if (!biayaSekolahDoc.exists) {
            return res.status(404).send(`BiayaSekolah document with id ${biayasekolahid} not found`);
        }

        const biayaSekolahData = biayaSekolahDoc.data();
        const randomDigits = generateRandomDigits();
        const idtagihan = `${biayasekolahid}-${randomDigits}`;
        const nomerpembayaran = `PAY-${biayasekolahid}-${randomDigits}`;
        const tagihanData = {
            idtagihan,
            nomerpembayaran,
            totaltagihan: biayaSekolahData.totalBiaya,
            statuspembayaran: biayaSekolahData.isPaid,
            tanggalbayar: null,
            adminpenerima: '',
            keterangan: '',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        };

        await db.collection('tagihan').doc(idtagihan).set(tagihanData);
        res.status(200).send(`Tagihan created with id: ${idtagihan}`);
    } catch (error) {
        res.status(500).send('Error generating tagihan: ' + error.message);
    }
};



// Generate multiple tagihan
exports.generateMultipleTagihan = async (req, res) => {
    try {
        const { biayasekolahids } = req.body; // Expect an array of biayasekolahids
        const batch = db.batch();

        for (const biayasekolahid of biayasekolahids) {
            // Extract historysiswaid from biayasekolahid
            const [noinduksiswa, tahunAjaranSekarang, monthIndex] = biayasekolahid.split('-');
            const historysiswaid = `${noinduksiswa}-${tahunAjaranSekarang}`;

            const biayaSekolahRef = db.collection('historysiswa').doc(historysiswaid).collection('biayasekolah').doc(biayasekolahid);
            const biayaSekolahDoc = await biayaSekolahRef.get();

            if (!biayaSekolahDoc.exists) {
                return res.status(404).send(`BiayaSekolah document with id ${biayasekolahid} not found`);
            }

            const biayaSekolahData = biayaSekolahDoc.data();
            const randomDigits = generateRandomDigits();
            const idtagihan = `tagihan-${biayasekolahid}-${randomDigits}`;
            const nomerpembayaran = `PAY-${biayasekolahid}-${randomDigits}`;
            const tagihanData = {
                idtagihan,
                nomerpembayaran,
                totaltagihan: biayaSekolahData.totalBiaya,
                statuspembayaran: biayaSekolahData.isPaid,
                tanggalbayar: null,
                adminpenerima: '',
                keterangan: '',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            };

            const tagihanRef = db.collection('tagihan').doc(idtagihan);
            batch.set(tagihanRef, tagihanData);
        }

        await batch.commit();
        res.status(200).send('Multiple tagihan created successfully');
    } catch (error) {
        res.status500().send('Error generating multiple tagihan: ' + error.message);
    }
};

// Approve payment and set isVerified to true
exports.approvePayment = async (req, res) => {
    try {
        const { paymentid } = req.params;
        const { adminVerificator } = req.body;

        const paymentHistoryRef = db.collection('paymenthistory').doc(paymentid);
        const paymentHistoryDoc = await paymentHistoryRef.get();

        if (!paymentHistoryDoc.exists) {
            return res.status(404).send(`PaymentHistory document with id ${paymentid} not found`);
        }

        await paymentHistoryRef.update({
            statusPembayaran: 'sukses',
            isVerified: true,
            adminVerificator,
            updatedAt: FieldValue.serverTimestamp()
        });

        res.status(200).send(`PaymentHistory document with id ${paymentid} approved successfully`);
    } catch (error) {
        res.status(500).send('Error approving PaymentHistory document: ' + error.message);
    }
};

// Reject payment and set isVerified to true
exports.rejectPayment = async (req, res) => {
    try {
        const { paymentid } = req.params;
        const { adminVerificator } = req.body;

        const paymentHistoryRef = db.collection('paymenthistory').doc(paymentid);
        const paymentHistoryDoc = await paymentHistoryRef.get();

        if (!paymentHistoryDoc.exists) {
            return res.status(404).send(`PaymentHistory document with id ${paymentid} not found`);
        }

        await paymentHistoryRef.update({
            statusPembayaran: 'gagal',
            isVerified: true,
            adminVerificator,
            updatedAt: FieldValue.serverTimestamp()
        });

        res.status(200).send(`PaymentHistory document with id ${paymentid} rejected successfully`);
    } catch (error) {
        res.status(500).send('Error rejecting PaymentHistory document: ' + error.message);
    }
};
