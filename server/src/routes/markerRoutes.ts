import express from 'express';
import { DBManager } from '../dbmanager.js';
const router = express.Router();

const dbInstance = DBManager.getDatabase();

router.get('/login', (req, res) => {
    const email = req.query.MarkerEmail as string;
    const password = req.query.Password as string;

    if (!email || !password) {
        return res
            .status(400)
            .json({ error: 'MarkerEmail and Password are required' });
    }

    try {
        const query = `
            SELECT MarkerRole, MarkingStyle 
            FROM marker 
            WHERE MarkerEmail = ? AND Password = ?
        `;

        const stmt = dbInstance.prepare(query);
        const marker = stmt.get(email, password);

        if (!marker) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        res.json({
            MarkerEmail: email,
            MarkerRole: marker.MarkerRole,
            MarkingStyle: marker.MarkingStyle,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/demiMarkers', (req, res) => {
    try {
        const query =
            "SELECT DISTINCT MarkerEmail, Name, Surname, Password, MarkingStyle FROM marker WHERE MarkerRole = 'Demi'";

        const stmt = dbInstance.prepare(query);

        const demiMarkers = stmt.all();

        res.json(demiMarkers);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/markers', (req, res) => {
    try {
        const query =
            "SELECT DISTINCT MarkerEmail, Name, Surname, Password FROM marker WHERE MarkerRole <> 'Admin'";

        const stmt = dbInstance.prepare(query);

        const demiMarkers = stmt.all();

        res.json(demiMarkers);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/lecturers', (req, res) => {
    try {
        const query =
            "SELECT DISTINCT MarkerEmail, Name, Surname, Password, MarkingStyle FROM marker WHERE MarkerRole <> 'Demi' AND MarkerRole <> 'Admin'";
        const stmt = dbInstance.prepare(query);

        const lecturers = stmt.all();

        res.json(lecturers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/moderators', (req, res) => {
    try {
        const query =
            "SELECT DISTINCT MarkerEmail, Name, Surname FROM marker WHERE MarkerRole <> 'Demi' AND MarkerRole <> 'Admin'";
        const stmt = dbInstance.prepare(query);
        const moderators = stmt.all();
        res.json(moderators);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/addLecturer', (req, res) => {
    const { MarkerEmail, Name, Surname, Password, MarkingStyle } = req.body;

    try {
        const query = `
            INSERT INTO marker (MarkerEmail, Name, Surname, Password, MarkingStyle, MarkerRole)
            VALUES (?, ?, ?, ?, ?, 'Lecturer')
        `;
        const stmt = dbInstance.prepare(query);
        stmt.run(MarkerEmail, Name, Surname, Password, MarkingStyle);
        res.json({ message: 'Lecturer added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error adding lecturer' });
    }
});

router.put('/updateMarkingStyle', (req, res) => {
    const { markingStyle, markerEmail } = req.body;

    const query = 'UPDATE marker SET MarkingStyle = ? WHERE MarkerEmail = ?';

    try {
        const stmt = dbInstance.prepare(query);
        stmt.run(markingStyle, markerEmail);
        res.status(200).json({ message: 'Marking style updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating marking style' });
    }
});

router.put('/updatePassword', (req, res) => {
    const { markerEmail, password } = req.body;
    const query = 'UPDATE marker SET Password = ? WHERE MarkerEmail = ?';

    try {
        const stmt = dbInstance.prepare(query);
        stmt.run(markerEmail, password);
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating password' });
    }
});

router.put('/addDemiMarker', (req, res) => {
    const { MarkerEmail, Name, Surname, Password, MarkingStyle } = req.body;

    try {
        const query =
            'INSERT INTO marker (MarkerEmail, Name, Surname, Password, MarkerRole, MarkingStyle) VALUES (?,?,?,?,?,?)';

        const stmt = dbInstance.prepare(query);

        stmt.run(MarkerEmail, Name, Surname, Password, 'Demi', MarkingStyle);
        res.json({ message: 'Demi marker added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error adding demi marker' });
    }
});

router.put('/editMarker', (req, res) => {
    const { MarkerEmail, Name, Surname, Password, MarkingStyle } = req.body;
    const query =
        'UPDATE marker SET Name = ?, Surname = ?, Password = ?, MarkingStyle = ? WHERE MarkerEmail = ?';

    const stmt = dbInstance.prepare(query);
    try {
        stmt.run(Name, Surname, Password, MarkingStyle, MarkerEmail);
        res.status(200).json({ message: 'Marker updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating marker' });
    }
});

router.delete('/deleteMarker', async (req, res) => {
    try {
        const markerEmail = req.query.MarkerEmail as string;
        const deletedAssessmentMarkers =
            await deleteMarkersFromAssessmentTable(markerEmail);
        const deletedMarkerEmail =
            await deleteAssessmentMarkerEmail(markerEmail);
        await Promise.all([deletedAssessmentMarkers, deletedMarkerEmail]);
        const query = 'DELETE FROM marker WHERE MarkerEmail = ?';
        const stmt = dbInstance.prepare(query);
        stmt.run(markerEmail);
        res.status(200).json({
            message: 'Marker deleted successfully',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting marker' });
    }
});

async function deleteAssessmentMarkerEmail(markerEmail: string) {
    return new Promise((resolve, reject) => {
        try {
            const deleteQuery =
                'DELETE FROM assessmentmarkers where MarkerEmail = ?';
            const stmt = dbInstance.prepare(deleteQuery);
            stmt.run(markerEmail);
            resolve(true);
        } catch (err) {
            console.error(err);

            reject(err);
        }
    });
}

async function deleteMarkersFromAssessmentTable(markerEmail: string) {
    return new Promise((resolve, reject) => {
        try {
            const selectQuery =
                'SELECT AssessmentID, MarkerEmails FROM assessment WHERE MarkerEmails LIKE ?';

            const stmt = dbInstance.prepare(selectQuery);

            const assessments = stmt.all();

            for (const assessment of assessments) {
                const assessmentId = assessment.AssessmentID as number;
                let emailArray = JSON.parse(assessment.MarkerEmails as string);
                emailArray = emailArray.filter(
                    (email: string) => email !== markerEmail,
                );
                const updatedEmails = JSON.stringify(emailArray);
                console.log('Updated emails:', updatedEmails);
                const updateQuery =
                    'UPDATE assessment SET MarkerEmails = ? WHERE AssessmentID = ?';
                const updateStmt = dbInstance.prepare(updateQuery);
                updateStmt.run(updatedEmails, assessmentId);
            }
            resolve(true);
        } catch (err) {
            console.error(err);
            reject(err);
        }
    });
}

export async function deleteAssessmentMarkers(assessmentId: string) {
    return new Promise((resolve, reject) => {
        try {
            const query =
                'DELETE FROM assessmentmarkers WHERE AssessmentID = ?';
            const stmt = dbInstance.prepare(query);
            stmt.run(assessmentId);
            resolve(true);
        } catch (err) {
            console.error(err);
            reject(err);
        }
    });
}

export default router;
