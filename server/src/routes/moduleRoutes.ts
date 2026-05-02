import express from 'express';
import { DBManager } from '../dbmanager.js';
const router = express.Router();

const dbInstance = DBManager.getDatabase();

router.get('/modules', (req, res) => {
    const query = 'SELECT ModuleName, ModuleCode FROM module';

    const stmt = dbInstance.prepare(query);
    const results = stmt.all();

    if (!results) {
        res.status(404).json({ error: 'No modules found' });
        return;
    }

    const modules = results.map((result: any) => ({
        ModuleCode: result.ModuleCode,
        ModuleName: result.ModuleName,
    }));

    res.json(modules);
});

router.put('/addModule', (req, res) => {
    const moduleCode = req.body.ModuleCode as string;
    const moduleName = req.body.ModuleName as string;

    try {
        const query =
            'INSERT INTO module (ModuleCode, ModuleName) VALUES (?,?)';
        const stmt = dbInstance.prepare(query);
        stmt.run(moduleCode, moduleName);
        res.json({ message: 'Module added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error adding module' });
    }
});

router.put('/editModule', (req, res) => {
    const moduleCode = req.query.ModuleCode as string;
    const moduleName = req.query.ModuleName as string;
    console.log(moduleCode, moduleName);

    try {
        const query = 'UPDATE module SET ModuleName = ? WHERE ModuleCode = ?';
        const stmt = dbInstance.prepare(query);
        stmt.run(moduleName, moduleCode);
        res.json({ message: 'Module updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating module' });
    }
});

router.delete('/deleteModule', (req, res) => {
    const ModuleCode = req.query.ModuleCode as string;

    try {
        const query = 'DELETE FROM module WHERE ModuleCode = ?';
        const stmt = dbInstance.prepare(query);
        stmt.run(ModuleCode);
        res.json({ message: 'Module deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting module' });
    }
});

export default router;
