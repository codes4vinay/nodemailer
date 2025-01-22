const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const axios = require("axios");

const app = express();

const url = `https://app.filetranfer.tech/`;
const interval = 900000;

function reloadWebsite() {
  axios
    .get(url)
    .then((response) => {
      console.log("website reloded");
    })
    .catch((error) => {
      console.error(`Error : ${error.message}`);
    });
}

setInterval(reloadWebsite, interval);

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

// Use `array` instead of `single` for multiple files
const upload = multer({ storage: Storage }).array('images', 10); // Limit to 10 files at a time

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile('/index.html');
});

app.post('/sendemail', (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            return res.end("Error uploading files.");
        }

        const { to, subject, body } = req.body;
        const attachments = req.files.map(file => ({ path: file.path }));

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
            attachments: attachments
        };

        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.log(err);
                return res.status(500).send("Failed to send email.");
            } else {
                console.log("Email Sent: " + info.response);

                // Delete all uploaded files
                attachments.forEach(attachment => {
                    fs.unlink(attachment.path, function (err) {
                        if (err) {
                            console.log("Failed to delete file:", attachment.path);
                        } else {
                            console.log(`Deleted file: ${attachment.path}`);
                        }
                    });
                });

                return res.redirect('/result.html');
            }
        });
    });
});

app.listen(5000, () => {
    console.log("App started on port 5000");
});
