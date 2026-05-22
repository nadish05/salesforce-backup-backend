const sqlite3 = require('sqlite3').verbose();

const path = require('path');

const dbPath = path.join(
    __dirname,
    '../backup.db'
);

const db = new sqlite3.Database(
    dbPath,
    (err) => {

        if (err) {

            console.error(
                'Database connection error:',
                err.message
            );

        } else {

            console.log(
                'Connected to SQLite database'
            );

        }

    }
);

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS jobs (
            jobId TEXT PRIMARY KEY,
            status TEXT,
            orgAlias TEXT,
            repoUrl TEXT,
            error TEXT,
            createdAt TEXT,
            updatedAt TEXT
        )
    `);

});

module.exports = db;