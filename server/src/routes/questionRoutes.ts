import express from 'express';
import { DBManager } from '../dbmanager.js';
import { error } from 'console';
const router = express.Router();

const dbInstance = DBManager.getDatabase();

router.get('/questionPerMark', (req, res) => {
    try {
        const submissionID = req.query.SubmissionID as string;
        const query = `
        SELECT QuestionText, MarkAllocation 
        FROM questions 
        WHERE SubmissionID = ?
        ORDER BY QuestionID ASC
    `;
        const stmt = dbInstance.prepare(query);
        const result = stmt.get(submissionID);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching question per mark' });
    }
});

router.put('/updateQuestionMark', (req, res) => {
    const { submissionID, questionID, markAllocation } = req.body;
    const selectQuery = `
            SELECT * FROM questions WHERE SubmissionID = ? AND QuestionText = ?
        `;

    try {
        const selectStmt = dbInstance.prepare(selectQuery);
        const results = selectStmt.all(submissionID, questionID);

        if (results.length === 0) {
            const insertQuery = `
                        INSERT INTO questions (SubmissionID, QuestionText, MarkAllocation) 
                        VALUES (?, ?, ?)
                    `;
            const insertStmt = dbInstance.prepare(insertQuery);
            insertStmt.run(submissionID, questionID, markAllocation);
        } else {
            const updateQuery = `
                        UPDATE questions SET MarkAllocation = ? WHERE SubmissionID = ? AND QuestionText = ?
                    `;
            const updateStmt = dbInstance.prepare(updateQuery);
            updateStmt.run(markAllocation, submissionID, questionID);
        }
        res.status(200).json({ message: 'Question mark updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating question mark' });
    }
});

export function deleteQuestions(assessmentId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
            const query =
                'DELETE FROM questions WHERE SubmissionID IN (SELECT SubmissionID FROM submissions WHERE AssessmentID = ?)';

            const stmt = dbInstance.prepare(query);
            stmt.run(assessmentId);
            resolve(true);
        } catch (error) {
            reject(error);
        }
    });
}

export default router;
