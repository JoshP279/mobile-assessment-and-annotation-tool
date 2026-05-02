import express from 'express';
import { DBManager } from '../dbmanager.js';
import { updateAssessmentSubmissionCount } from './assessmentRoutes.js';
import { deleteQuestions } from './questionRoutes.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const projectRoot = process.cwd();
const uploadsDir = path.join(projectRoot, 'uploads');
const storage = multer.memoryStorage();
const upload = multer({ storage });
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const dbInstance = DBManager.getDatabase();

const router = express.Router();

interface SubmissionInfo {
    AssessmentID: number;
    SubmissionPDF: Uint8Array<ArrayBuffer>;
    StudentNum: string;
    StudentName: string;
    StudentSurname: string;
    SubmissionStatus: string;
    SubmissionFolderName: string;
}

router.put('/addSubmission', (req, res) => {
    try {
        const submissionInfo = req.body as SubmissionInfo;
        const submissionObject = submissionInfo.SubmissionPDF;
        const { SubmissionPDF, ...infoWithoutPDF } = submissionInfo;
        const submissionBuffer = Buffer.from(Object.values(submissionObject));
        addSubmission(submissionInfo, submissionBuffer);
        updateAssessmentSubmissionCount(submissionInfo.AssessmentID);
        res.status(200).json({ message: 'Submission added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error adding submission' });
    }
});

router.get('/submissions', (req, res) => {
    const query =
        'SELECT AssessmentID, SubmissionID,StudentNum, SubmissionMark,StudentName, StudentSurname, SubmissionStatus, SubmissionFolderName FROM submissions WHERE AssessmentID = ?';

    const assessmentId = req.query.AssessmentID as string;
    const stmt = dbInstance.prepare(query);

    const results = stmt.all(assessmentId);
    const submissions = results.map((result) => ({
        submissionID: result.SubmissionID,
        assessmentID: result.AssessmentID,
        studentNumber: result.StudentNum,
        submissionMark: result.SubmissionMark,
        studentName: result.StudentName,
        studentSurname: result.StudentSurname,
        submissionStatus: result.SubmissionStatus,
        submissionFolderName: result.SubmissionFolderName,
    }));

    res.status(200).json(submissions);
    try {
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching submissions' });
    }
});

router.put('/updateSubmission', (req, res) => {
    try {
        const submissionID = req.body.SubmissionID;
        const submissionName = req.body.StudentName;
        const submissionSurname = req.body.StudentSurname;
        const submissionMark = req.body.SubmissionMark;
        const query =
            'UPDATE submissions SET StudentName = ?, StudentSurname = ?, SubmissionMark = ? WHERE SubmissionID = ?';

        const stmt = dbInstance.prepare(query);

        stmt.run(
            submissionName,
            submissionSurname,
            submissionMark,
            submissionID,
        );

        res.status(200).json({ message: 'Submission updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating submission' });
    }
});

router.put('/editSubmission', (req, res) => {
    const {
        SubmissionID,
        SubmissionPDF,
        StudentNum,
        StudentName,
        StudentSurname,
        SubmissionStatus,
        SubmissionFolderName,
    } = req.body;
    const submissionBuffer = Buffer.from(Object.values(SubmissionPDF));
    const query = `
        UPDATE submissions 
        SET 
            SubmissionPDF = ?, 
            StudentName = ?, 
            StudentSurname = ?, 
            SubmissionStatus = ?, 
            SubmissionFolderName = ?
        WHERE 
            AssessmentID = ? 
            AND StudentNum = ?;
    `;

    try {
        const stmt = dbInstance.prepare(query);
        const results = stmt.run(
            submissionBuffer,
            StudentName,
            StudentSurname,
            SubmissionStatus,
            SubmissionFolderName,
            SubmissionID,
            StudentNum,
        );
        if (results) {
            updateAssessmentSubmissionCount(SubmissionID);
            res.status(200).json({
                message: 'Submission edited successfully!',
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json('Failed to edit submission');
    }
});

router.get('/submissionPDF', (req, res) => {
    const query =
        'SELECT SubmissionPDF FROM submissions WHERE SubmissionID = ?';

    try {
        const submissionID = req.query.SubmissionID as string;
        const stmt = dbInstance.prepare(query);
        const result = stmt.get(submissionID);

        if (!result) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        const raw = result.SubmissionPDF;

        if (!raw) {
            return res.status(404).json({ error: 'PDF not found' });
        }

        const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as any);
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=memorandum_${submissionID}.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching PDF' });
    }
});

router.put('/updateSubmissionStatus', async (req, res) => {
    let { submissionID, submissionStatus } = req.body;

    const updateSubmissionQuery =
        'UPDATE submissions SET SubmissionStatus = ? WHERE SubmissionID = ?';

    try {
        const stmt = dbInstance.prepare(updateSubmissionQuery);
        const result = stmt.run(submissionStatus, submissionID);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        await Promise.all([updateAssessmentSubmissionCount(submissionID)]);
        res.status(200).json({
            message: 'Submission status updated successfully',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating submission status' });
    }
});

router.put('/uploadMarkedSubmission', upload.single('pdfFile'), (req, res) => {
    const { submissionID, totalMarks, markingStyle } = req.body;
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const pdfBuffer = req.file.buffer;
    const filePath = path.join(uploadsDir, `submission_${submissionID}.pdf`);

    fs.writeFile(filePath, pdfBuffer, (err) => {
        if (err) {
            console.error('Error saving uploaded file:', err);
            return res
                .status(500)
                .json({ error: 'Error saving uploaded file' });
        }
        const queryUpdatePDF =
            'UPDATE submissions SET MarkedSubmissionPDF = ? WHERE SubmissionID = ?';

        try {
            const stmt = dbInstance.prepare(queryUpdatePDF);
            stmt.run(pdfBuffer, submissionID);
            const pythonExe = path.join(
                projectRoot,
                '..',
                'neural-network',
                '.venv',
                'Scripts',
                'python.exe',
            );

            const scriptPath = path.join(
                projectRoot,
                '..',
                'neural-network',
                'src',
                'main.py',
            );

            const pythonProcess = spawn(pythonExe, [
                scriptPath,
                filePath,
                submissionID,
                totalMarks,
                markingStyle,
            ]);

            pythonProcess.stdout.on('data', (data) => {
                console.log(`Script output: ${data}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                console.error(`Script error: ${data}`);
            });

            pythonProcess.on('exit', (code) => {
                console.log(`Python process exited with code: ${code}`);
            });

            pythonProcess.on('error', (err) => {
                console.error(`Python spawn error:`, err);
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('Script executed successfully.');
                } else {
                    console.error(`Script exited with code ${code}`);
                }
            });

            return res.status(200).json({
                message: 'File uploaded and database updated successfully',
                submissionID,
                filePath,
            });
        } catch (err) {
            console.error('Error updating submission with marked PDF:', err);
            res.status(500).json({
                error: 'Error updating submission with marked PDF',
            });
        }
    });
});

router.put('/markedSubmision', (req, res) => {
    const submissionID = req.query.SubmissionID as string;

    const query =
        'SELECT MarkedSubmissionPDF FROM submissions WHERE SubmissionID = ?';

    try {
        const stmt = dbInstance.prepare(query);
        const result = stmt.get(submissionID);

        if (!result) {
            return res.status(404).json({ error: 'Submission not found' });
        }
        const raw = result.MarkedSubmissionPDF;

        if (!raw) {
            return res.status(404).json({ error: 'Marked PDF not found' });
        }
        const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as any);
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=marked_submission_${submissionID}.pdf`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching marked PDF' });
    }
});

router.put('/updateSubmissionMark', (req, res) => {
    const submissionID = req.body.submissionID as string;
    const totalMark = req.body.totalMark as number;
    const query =
        'UPDATE submissions SET SubmissionMark = ? WHERE SubmissionID = ?';

    try {
        const stmt = dbInstance.prepare(query);
        stmt.run(submissionID, totalMark);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating submission mark' });
    }
});

function addSubmission(
    submissionInfo: SubmissionInfo,
    submissionBuffer: Buffer,
) {
    const query =
        'INSERT INTO submissions (AssessmentID, SubmissionPDF, StudentNum, StudentName, StudentSurname, SubmissionStatus, SubmissionFolderName) VALUES (?,?,?,?,?,?,?)';
    try {
        const stmt = dbInstance.prepare(query);
        stmt.run(
            submissionInfo.AssessmentID,
            submissionBuffer,
            submissionInfo.StudentNum,
            submissionInfo.StudentName,
            submissionInfo.StudentSurname,
            submissionInfo.SubmissionStatus,
            submissionInfo.SubmissionFolderName,
        );
    } catch (err) {
        throw err;
    }
}

export async function deleteAssessmentSubmissions(assessmentId: string) {
    const questionDeleted = await deleteQuestions(assessmentId);

    await Promise.all([questionDeleted]);
    const query = 'DELETE FROM submissions WHERE AssessmentID = ?';
    try {
        const stmt = dbInstance.prepare(query);
        stmt.run(assessmentId);
    } catch (err) {
        throw err;
    }
}

export default router;
