import express from 'express';
import { DBManager } from '../dbmanager.js';
import { deleteAssessmentMarkers } from './markerRoutes.js';
import { deleteAssessmentSubmissions } from './submissionRoutes.js';

const router = express.Router();

const dbInstance = DBManager.getDatabase();

interface AssessmentInfo {
    LecturerEmail: string;
    MarkerEmail: string[];
    AssessmentName: string;
    ModuleCode: string;
    Memorandum: Uint8Array<ArrayBuffer>;
    ModEmail: string;
    TotalMark: number;
    NumSubmissionsMarked: number;
    TotalNumSubmissions: number;
    AssessmentType: string;
}

router.put('/addAssessment', (req, res) => {
    try {
        const assessmentInfo = req.body;
        const memoObject = assessmentInfo.Memorandum;
        const memoBuffer = Buffer.from(Object.values(memoObject));
        const assessmentID = addAssessment(assessmentInfo, memoBuffer);
        res.status(200).json({
            message: 'Assessment added successfully',
            assessmentID,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error adding assessment' });
    }
});

router.get('/assessments', (req, res) => {
    try {
        const query = `
            SELECT AssessmentID, LecturerEmail, ModuleCode, AssessmentName, NumSubmissionsMarked, TotalNumSubmissions, ModEmail, AssessmentType, TotalMark 
            FROM assessment 
            WHERE 
                MarkerEmails LIKE CONCAT('%"', ?, '"%')
            OR LecturerEmail = ?
            OR ModEmail = ?`;
        const email = req.query.MarkerEmail as string;
        const stmt = dbInstance.prepare(query);
        const results = stmt.all(email, email, email);
        const assessments = results.map((result) => ({
            assessmentID: result.AssessmentID,
            lecturerEmail: result.LecturerEmail,
            moduleCode: result.ModuleCode,
            assessmentName: result.AssessmentName,
            numMarked: result.NumSubmissionsMarked,
            totalSubmissions: result.TotalNumSubmissions,
            modEmail: result.ModEmail,
            assessmentType: result.AssessmentType,
            totalMarks: result.TotalMark,
        }));
        res.json(assessments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error retrieving assessments' });
    }
});

router.put('/editAssessment', (req, res) => {
    try {
        const assessmentInfo = req.body;
        const markerEmail = assessmentInfo.MarkerEmail;

        const markerEmailString = JSON.stringify(markerEmail);
        const query = `UPDATE assessment 
                                       SET MarkerEmails = ?, 
                                           AssessmentName = ?, 
                                           ModuleCode = ?, 
                                           ModEmail = ?, 
                                           TotalMark = ? 
                                       WHERE AssessmentID = ?`;

        const stmt = dbInstance.prepare(query);
        stmt.run(
            markerEmailString,
            assessmentInfo.AssessmentName,
            assessmentInfo.ModuleCode,
            assessmentInfo.ModEmail,
            assessmentInfo.TotalMark,
            assessmentInfo.AssessmentID,
        );
        const currentMarkers = getCurrentMarkersForAssessment(
            assessmentInfo.AssessmentID,
        );

        const markersToAdd = markerEmail.filter(
            (markerEmail: string) => !currentMarkers.includes(markerEmail),
        );
        const markersToRemove = currentMarkers.filter(
            (markerEmail) => !markerEmail.includes(markerEmail),
        );

        markersToAdd.forEach((markerEmail: string) => {
            addAssessmentMarkerEmail(assessmentInfo.AssessmentID, markerEmail);
        });

        markersToRemove.forEach((markerEmail: string) => {
            removeAssessmentMarkerEmail(
                assessmentInfo.AssessmentID,
                markerEmail,
            );
        });
        res.status(200).json({ message: 'Assessment edited successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error editing assessment' });
    }
});

router.get('/assessmentInfo', (req, res) => {
    try {
        const query =
            'SELECT MarkerEmails, AssessmentName, ModuleCode, ModEmail, TotalMark FROM assessment WHERE AssessmentID = ?';

        const assessmentId = req.query.AssessmentID as string;
        const stmt = dbInstance.prepare(query);
        const result = stmt.get(assessmentId);

        if (!result) {
            return res.status(404).json({ error: 'Assessment not found' });
        }
        const assessmentInfo = {
            AssessmentName: result.AssessmentName,
            ModuleCode: result.ModuleCode,
            ModEmail: result.ModEmail,
            TotalMark: result.TotalMark,
            MarkerEmail: result.MarkerEmails,
        };
        return res.status(200).json(assessmentInfo);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching assessment info' });
    }
});

router.get('/allAssessments', (req, res) => {
    try {
        const query = `SELECT AssessmentID, ModuleCode, AssessmentName, LecturerEmail, NumSubmissionsMarked, TotalNumSubmissions, ModEmail 
                FROM assessment`;
        const stmt = dbInstance.prepare(query);
        const results = stmt.all();
        const allAssessments = results.map((result) => {
            return {
                assessmentID: result.AssessmentID,
                lecturerEmail: result.LecturerEmail,
                moduleCode: result.ModuleCode,
                assessmentName: result.AssessmentName,
                numMarked: result.NumSubmissionsMarked,
                totalSubmissions: result.TotalNumSubmissions,
                modEmail: result.ModEmail,
                assessmentType: result.AssessmentType,
                totalMarks: result.TotalMark,
            };
        });
        res.status(200).json(allAssessments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching all assessments' });
    }
});

router.get('/memoPDF', (req, res) => {
    try {
        const assessmentId = req.query.AssessmentID as string;
        const query =
            'SELECT MemorandumPDF FROM assessment WHERE AssessmentID = ?';
        const stmt = dbInstance.prepare(query);
        const result = stmt.get(assessmentId);

        if (!result || !result?.MemorandumPDF) {
            return res.status(404).json({ error: 'Assessment not found' });
        }
        const raw = result.MemorandumPDF;

        if (!raw) {
            return res.status(404).json({ error: 'PDF not found' });
        }

        const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as any);

        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=memorandum_${assessmentId}.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching memorandum' });
    }
});

router.delete('/deleteAssessment', async (req, res) => {
    const assessmentId = req.query.AssessmentID as string;

    await Promise.all([
        deleteAssessmentSubmissions(assessmentId),
        deleteAssessmentMarkers(assessmentId),
    ]);

    try {
        const query = 'DELETE FROM assessment where AssessmentID = ?';
        const stmt = dbInstance.prepare(query);
        stmt.run(assessmentId);
        res.status(200).json({ message: 'Assessment deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting assessment' });
    }
});

function removeAssessmentMarkerEmail(
    assessmentId: number,
    markerEmail: string,
) {
    try {
        const query =
            'DELETE FROM "AssessmentMarkers" WHERE AssessmentID = ? AND MarkerEmail = ?';
        const stmt = dbInstance.prepare(query);
        stmt.run(assessmentId, markerEmail);
    } catch (err) {
        throw err;
    }
}

function getCurrentMarkersForAssessment(assessmentId: number): string[] {
    try {
        const query = `SELECT MarkerEmail FROM assessmentmarkers WHERE AssessmentID = ?`;

        const stmt = dbInstance.prepare(query);

        const results = stmt.all(assessmentId);
        return results.map((row) => row.MarkerEmail as string);
    } catch (err) {
        throw err;
    }
}

function addAssessment(
    assessmentInfo: AssessmentInfo,
    memoBuffer: Buffer<ArrayBuffer>,
): number {
    try {
        const query = `
            INSERT INTO "Assessment" (
                LecturerEmail, MarkerEmails, AssessmentName, ModuleCode, MemorandumPDF, ModEmail, TotalMark, NumSubmissionsMarked, TotalNumSubmissions, AssessmentType
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)
        `;
        const stmt = dbInstance.prepare(query);
        const result = stmt.run(
            assessmentInfo.LecturerEmail,
            JSON.stringify(assessmentInfo.MarkerEmail),
            assessmentInfo.AssessmentName,
            assessmentInfo.ModuleCode,
            memoBuffer,
            assessmentInfo.ModEmail,
            assessmentInfo.TotalMark,
            assessmentInfo.NumSubmissionsMarked,
            assessmentInfo.TotalNumSubmissions,
            assessmentInfo.AssessmentType,
        );
        const resultId = result.lastInsertRowid as number;

        addAssessmentMarkerEmail(resultId, assessmentInfo.LecturerEmail);
        updateAssessmentSubmissionCount(resultId);

        return resultId;
    } catch (err) {
        throw err;
    }
}

function addAssessmentMarkerEmail(assessmentId: number, markerEmail: string) {
    try {
        const query =
            'INSERT INTO "AssessmentMarkers" (MarkerEmail, AssessmentID) VALUES (?,?)';
        const stmt = dbInstance.prepare(query);
        stmt.run(markerEmail, assessmentId);
    } catch (err) {
        throw err;
    }
}

export async function updateAssessmentSubmissionCount(assessmentId: number) {
    return new Promise((resolve, reject) => {
        try {
            const totalSubmissionsStmt = dbInstance.prepare(
                'SELECT COUNT(*) as count FROM submissions WHERE AssessmentID = ?',
            );
            const totalSubmissions =
                totalSubmissionsStmt?.get(assessmentId)?.count;

            const markedSubmissionsStmt = dbInstance.prepare(
                "SELECT COUNT(*) as count FROM submissions WHERE AssessmentID = ? AND SubmissionStatus = 'Marked'",
            );
            const markedSubmissions =
                markedSubmissionsStmt?.get(assessmentId)?.count;

            const updateStmt = dbInstance.prepare(
                'UPDATE assessment SET TotalNumSubmissions = ?, NumSubmissionsMarked = ? WHERE AssessmentID = ?',
            );

            if (
                totalSubmissions === undefined ||
                totalSubmissions === null ||
                markedSubmissions === undefined ||
                markedSubmissions === null
            ) {
                reject(new Error('Error fetching submission counts'));
                return;
            }
            updateStmt?.run(totalSubmissions, markedSubmissions, assessmentId);
            resolve(true);
        } catch (err) {
            reject(err);
        }
    });
}

export default router;
