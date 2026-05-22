const express = require('express');

const {
    cleanupOldWorkspaces
} = require('./cleanupService');

const {
    runBackupJob
} = require('./backupJob');

const {
    cloneRepository
} = require('./gitService');

const {
    createWorkspace
} = require('./workspaceService');

const {
    createJob,
    getJob,
    getAllJobs
} = require('./jobService');

const app = express();

app.use(express.json());


// ========================================
// Health Check
// ========================================

app.get('/health', (req, res) => {

    res.json({
        status: 'OK'
    });

});


// ========================================
// Workspace Test Route
// ========================================

app.get('/workspace', (req, res) => {

    const workspace = createWorkspace();

    res.json(workspace);

});


// ========================================
// Clone Repository Test Route
// ========================================

app.post('/clone', async (req, res) => {

    try {

        const { repoUrl } = req.body;

        const workspace = createWorkspace();

        await cloneRepository(
            repoUrl,
            workspace.workspacePath
        );

        res.json({
            success: true,
            workspace
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.toString()
        });

    }

});


// ========================================
// Backup Route
// ========================================

app.post('/backup', async (req, res) => {

    try {

        const {
            repoUrl,
            orgAlias
        } = req.body;

        // Create Workspace
        const workspace = createWorkspace();

        // Create Job
        await createJob(
            workspace.jobId,
            {
                orgAlias,
                repoUrl,
                status: 'PENDING'
            }
        );

        // Start Background Job
        runBackupJob(
            workspace,
            repoUrl,
            orgAlias
        );

        // Return Immediately
        res.json({
            success: true,
            message: 'Backup job started',
            jobId: workspace.jobId
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.toString()
        });

    }

});


// ========================================
// Get All Jobs
// ========================================

app.get('/jobs', async (req, res) => {

    try {

        const jobs =
            await getAllJobs();

        res.json(jobs);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.toString()
        });

    }

});


// ========================================
// Get Single Job
// ========================================

app.get('/jobs/:jobId', async (req, res) => {

    try {

        const job =
            await getJob(
                req.params.jobId
            );

        if (!job) {

            return res.status(404).json({
                error: 'Job not found'
            });

        }

        res.json(job);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.toString()
        });

    }

});


// ========================================
// Cleanup Route
// ========================================

app.delete('/cleanup', async (req, res) => {

    try {

        await cleanupOldWorkspaces();

        res.json({
            success: true,
            message: 'Cleanup completed'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.toString()
        });

    }

});


// ========================================
// Start Server
// ========================================

app.listen(3000, () => {

    console.log(
        'Server running on port 3000'
    );

});