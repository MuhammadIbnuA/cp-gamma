const { db, bucket } = require('../database');
const { FieldValue } = require('firebase-admin').firestore;
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

exports.uploadBuktiFoto = upload.single('buktiFoto');

exports.generatePaymentHistory = async (req, res) => {
    try {
        const { biayasekolahid } = req.params;
        const { paymentMethod } = req.body;
        const buktiFotoFile = req.file;

        // Extract historysiswaid from biayasekolahid
        const historysiswaidParts = biayasekolahid.split('tagihan')[1].split('-');
        const historysiswaid = `${historysiswaidParts[0]}-${historysiswaidParts[1]}-${historysiswaidParts[2]}`;

        const biayaSekolahRef = db.collection('historysiswa').doc(historysiswaid).collection('biayasekolah').doc(biayasekolahid);
        const biayaSekolahDoc = await biayaSekolahRef.get();

        if (!biayaSekolahDoc.exists) {
            return res.status(404).send(`BiayaSekolah document with id ${biayasekolahid} not found`);
        }

        if (buktiFotoFile) {
            const buktiFotoFileName = `buktiFoto/${uuidv4()}-${buktiFotoFile.originalname}`;
            const buktiFotoFileRef = bucket.file(buktiFotoFileName);

            const buktiFotoStream = buktiFotoFileRef.createWriteStream({
                metadata: {
                    contentType: buktiFotoFile.mimetype
                }
            });

            buktiFotoStream.on('error', (error) => {
                console.error('Error uploading bukti foto to Firebase:', error);
                return res.status(500).json({ message: 'Error uploading bukti foto to Firebase' });
            });

            buktiFotoStream.on('finish', async () => {
                const buktiFotoUrl = `https://storage.googleapis.com/${bucket.name}/${buktiFotoFileName}`;

                const paymentid = `payment-${biayasekolahid}-${Math.floor(1000 + Math.random() * 9000)}`;
                const paymentHistoryData = {
                    paymentid,
                    biayasekolahid,
                    paymentMethod: paymentMethod || 'unknown',
                    buktiFoto: buktiFotoUrl,
                    isVerified: false,
                    statusPembayaran: 'pending',
                    adminVerificator: '',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                };

                await db.collection('paymenthistory').doc(paymentid).set(paymentHistoryData);

                res.status(200).send(`PaymentHistory document generated with id: ${paymentid}`);
            });

            buktiFotoStream.end(buktiFotoFile.buffer);
        } else {
            const paymentid = `payment-${biayasekolahid}-${Math.floor(1000 + Math.random() * 9000)}`;
            const paymentHistoryData = {
                paymentid,
                biayasekolahid,
                paymentMethod: paymentMethod || 'unknown',
                buktiFoto: '',
                isVerified: false,
                statusPembayaran: 'pending',
                adminVerificator: '',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            };

            await db.collection('paymenthistory').doc(paymentid).set(paymentHistoryData);

            res.status(200).send(`PaymentHistory document generated with id: ${paymentid}`);
        }
    } catch (error) {
        res.status(500).send('Error generating PaymentHistory document: ' + error.message);
    }
};
