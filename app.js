const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

/* ================= MULTER CONFIG ================= */

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './images'); // folder already exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
    }
});

const upload = multer({ storage }).single('image'); // ONLY ONE FILE

/* ================= ROUTES ================= */

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/sendemail', (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(500).send("File upload failed");
        }

        const { to, subject, body } = req.body;

        if (!to || !subject || !body || !req.file) {
            return res.status(400).send("All fields and one image are required");
        }

        const filePath = req.file.path;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'filespire@gmail.com',
                pass: 'qjzr moma kzxt iohy' // Gmail App Password
            }
        });

        const mailOptions = {
            from: 'filespire@gmail.com',
            to,
            subject,
            text: body,
            attachments: [
                { path: filePath }
            ]
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Email sending failed");
            }

            // DELETE FILE AFTER SUCCESS
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log("File delete failed:", err);
                } else {
                    console.log("File deleted:", filePath);
                }
            });

            console.log("Email sent:", info.response);
            res.redirect('/result.html');
        });
    });
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
