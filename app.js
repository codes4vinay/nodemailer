const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

/* ================= MULTER (ONE FILE, OPTIONAL) ================= */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    }
});

const upload = multer({ storage }).single('image');

/* ================= ROUTES ================= */

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/sendemail', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).send("File upload failed");
        }

        const { to, subject, body } = req.body;

        // ONLY EMAIL REQUIRED
        if (!to) {
            return res.status(400).send("Recipient email is required");
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER || 'filespire@gmail.com',
                pass: process.env.MAIL_PASS || 'YOUR_GMAIL_APP_PASSWORD'
            }
        });

        const mailOptions = {
            from: 'filespire@gmail.com',
            to,
            subject: subject || 'Filespire Mail',
            text: body || '',
            attachments: []
        };

        if (req.file) {
            mailOptions.attachments.push({ path: req.file.path });
        }

        try {
            await transporter.sendMail(mailOptions);

            // delete uploaded file after sending
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }

            res.send("Email sent successfully");
        } catch (error) {
            console.error(error);
            res.status(500).send("Email sending failed");
        }
    });
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
