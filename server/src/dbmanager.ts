import { DatabaseSync } from 'node:sqlite';

export class DBManager {
    private static _dbInstance: DatabaseSync | null = null;
    constructor() {}

    public static getDatabase(): DatabaseSync {
        if (!DBManager._dbInstance) {
            DBManager._dbInstance = new DatabaseSync('maat.db');
        }
        return DBManager._dbInstance;
    }
}
