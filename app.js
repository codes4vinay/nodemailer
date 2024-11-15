const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './images');
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

const upload = multer({ storage: Storage }).single('image');

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile('/index.html');
});

app.post('/sendemail', (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            return res.end("Error uploading file.");
        }
        const { to, subject, body } = req.body;
        const path = req.file.path;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'filespire@gmail.com',
                pass: 'qjzr moma kzxt iohy'
            }
        });

        const mailOptions = {
            from: 'filespire@gmail.com',
            to: to,
            subject: subject,
            text: body,
            attachments: [{ path: path }]
        };

        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.log(err);
                return res.status(500).send("Failed to send email.");
            } else {
                console.log("Email Sent: " + info.response);
                fs.unlink(path, function (err) {
                    if (err) {
                        console.log("Failed to delete file:", err);
                        return res.status(500).send("Email sent but failed to delete file.");
                    } else {
                        console.log("Image deleted from server!");
                        return res.redirect('http://localhost:5173');
                    }
                });
            }
        });
    });
});

app.listen(5000, () => {
    console.log("App started on port 5000");
});
