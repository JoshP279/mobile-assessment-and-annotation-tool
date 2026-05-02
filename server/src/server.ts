import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import markerRoutes from './routes/markerRoutes.js';
import { getIPAddress } from './utils.js';
import moduleRoutes from './routes/moduleRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import nodemailer from 'nodemailer';
import multer from 'multer';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const port = process.env['PORT'] ? parseInt(process.env['PORT']) : 8080;
const emailUser = process.env['MAAT_AUTOMAILER_EMAIL'];
const emailPassword = process.env['MAAT_AUTOMAILER_PASSWORD'];
const app = express();
const upload = multer();

app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Route definitions for assessment operations
app.put('/addAssessment', assessmentRoutes);
app.get('/assessmentInfo', assessmentRoutes);
app.put('/editAssessment', assessmentRoutes);
app.get('/assessments', assessmentRoutes);
app.get('/allAssessments', assessmentRoutes);
app.delete('/deleteAssessment', assessmentRoutes);
app.get('/memoPDF', assessmentRoutes);

// Route definition for submission operations
app.put('/addSubmission', submissionRoutes);
app.get('/submissions', submissionRoutes);
app.put('/updateSubmission', submissionRoutes);
app.put('/editSubmission', submissionRoutes);
app.get('/submissionPDF', submissionRoutes);
app.put('/updateSubmissionStatus', submissionRoutes);
app.put('/uploadMarkedSubmission', submissionRoutes);
app.get('/markedSubmission', submissionRoutes);
app.put('/updateSubmissionMark', submissionRoutes);

// Route definitions for marker operations
app.get('/login', markerRoutes);
app.get('/demiMarkers', markerRoutes);
app.get('/markers', markerRoutes);
app.get('/lecturers', markerRoutes);
app.get('/moderators', markerRoutes);
app.put('/addLecturer', markerRoutes);
app.put('/addDemiMarker', markerRoutes);
app.put('/editMarker', markerRoutes);
app.delete('/deleteMarker', markerRoutes);
app.put('/updateMarkingStyle', markerRoutes);
app.put('/updatePassword', markerRoutes);

// Route definitions for module operations
app.get('/modules', moduleRoutes);
app.put('/addModule', moduleRoutes);
app.put('/editModule', moduleRoutes);
app.delete('/deleteModule', moduleRoutes);

//Route definitions for question operations
app.get('/questionPerMark', questionRoutes);
app.put('/updateQuestionMark', questionRoutes);

app.listen(port, '0.0.0.0', () => {
    const ip = getIPAddress(); // Get the IP address
    console.log(`Server running on http://${ip}:${port}`);
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
        user: emailUser,
        pass: emailPassword,
    },
});

app.post('/sendStudentEmail', (req, res) => {
    const { to, subject, text, pdfData, filename } = req.body;
    const mailOptions = {
        from: emailUser,
        to,
        subject,
        text,
        attachments: [
            {
                filename: filename,
                content: Buffer.from(pdfData.data),
                contentType: 'application/pdf',
            },
        ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            res.status(500).send({
                message: 'Failed to send email',
                error: error,
            });
        } else {
            console.log(`Email sent successfully to ${to}`);
            res.status(200).json({ message: 'Email sent successfully' });
        }
    });
});

app.post('/sendModeratorEmail', upload.single('csv'), (req, res) => {
    const { to, subject, text } = req.body;
    const csvBuffer = req.file ? req.file.buffer : null;

    if (!csvBuffer || !req.file) {
        return res.status(400).send({
            message: 'No CSV file uploaded',
        });
    }
    const mailOptions = {
        from: emailUser,
        to,
        subject,
        text,
        attachments: [
            {
                filename: req.file.originalname,
                content: csvBuffer,
                contentType: 'application/csv',
            },
        ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.status(500).send({
                message: 'Failed to send email',
                error: error,
            });
        } else {
            console.log(`Email sent successfully to ${to}`);
            res.status(200).json({ message: 'Email sent successfully' });
        }
    });
});

app.post('/sendModeratorZipEmail', upload.single('zip'), (req, res) => {
    const { to, subject, text, filename } = req.body;
    const zipBuffer = req.file ? req.file.buffer : null;

    if (!zipBuffer || !req.file) {
        return res.status(400).send({
            message: 'No ZIP file uploaded',
        });
    }

    const mailOptions = {
        from: emailUser,
        to: to,
        subject,
        text,
        attachments: [
            {
                filename: filename,
                content: zipBuffer,
                contentType: 'application/zip',
            },
        ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            res.status(500).send({
                message: 'Failed to send email',
                error: error,
            });
        } else {
            console.log(`Email sent successfully to ${to}`);
            res.status(200).json({ message: 'Email sent successfully' });
        }
    });
});
