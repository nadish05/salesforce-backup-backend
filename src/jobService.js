const db = require('./database');


// ========================================
// Create Job
// ========================================

function createJob(jobId, data) {

    return new Promise((resolve, reject) => {

        const query = `
            INSERT INTO jobs (
                jobId,
                status,
                orgAlias,
                repoUrl,
                error,
                createdAt,
                updatedAt
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            jobId,
            data.status,
            data.orgAlias,
            data.repoUrl,
            null,
            new Date().toISOString(),
            new Date().toISOString()
        ];

        db.run(query, values, function(err) {

            if (err) {
                reject(err);
            } else {
                resolve();
            }

        });

    });

}


// ========================================
// Update Job
// ========================================

function updateJob(jobId, updates) {

    return new Promise((resolve, reject) => {

        const query = `
            UPDATE jobs
            SET
                status = ?,
                error = ?,
                updatedAt = ?
            WHERE jobId = ?
        `;

        const values = [
            updates.status,
            updates.error || null,
            new Date().toISOString(),
            jobId
        ];

        db.run(query, values, function(err) {

            if (err) {
                reject(err);
            } else {
                resolve();
            }

        });

    });

}


// ========================================
// Get Single Job
// ========================================

function getJob(jobId) {

    return new Promise((resolve, reject) => {

        const query = `
            SELECT * FROM jobs
            WHERE jobId = ?
        `;

        db.get(query, [jobId], (err, row) => {

            if (err) {
                reject(err);
            } else {
                resolve(row);
            }

        });

    });

}


// ========================================
// Get All Jobs
// ========================================

function getAllJobs() {

    return new Promise((resolve, reject) => {

        const query = `
            SELECT * FROM jobs
            ORDER BY createdAt DESC
        `;

        db.all(query, [], (err, rows) => {

            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }

        });

    });

}


module.exports = {
    createJob,
    updateJob,
    getJob,
    getAllJobs
};