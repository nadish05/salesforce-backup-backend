require('dotenv').config();
 
const express = require('express');
const fs = require('fs');
const { execSync } = require('child_process');
 
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
 
 
// ========================================
// Middleware
// ========================================
 
app.use(express.json());
 
 
// ========================================
// Environment Validation
// ========================================
 
if (!process.env.SFDX_AUTH_URL) {
 
    console.error(
        'Missing SFDX_AUTH_URL'
    );
 
    process.exit(1);
 
}
 
 
// ========================================
// Salesforce Authentication
// ========================================
 
function authenticateOrg() {
 
    try {
 
        console.log(
            'Authenticating Salesforce Org...'
        );
 
        // Write auth URL to file
        fs.writeFileSync(
            'auth.txt',
            process.env.SFDX_AUTH_URL
        );
 
        // Login to Salesforce Org
        execSync(
            'sf org login sfdx-url --sfdx-url-file auth.txt --alias agentforceOrg',
            {
                stdio: 'inherit'
            }
        );

        fs.unlinkSync('auth.txt');
 
        console.log(
            'Salesforce Org Authenticated'
        );
 
    } catch (error) {
 
        console.error(
            'Salesforce Authentication Failed'
        );
 
        console.error(error);
 
    }
 
}
 
 
// ========================================
// Health Check
// ========================================
 
app.get('/health', (req, res) => {
 
    res.json({
        success: true,
        status: 'OK'
    });
 
});
 
 
// ========================================
// Workspace Test Route
// ========================================
 
app.get('/workspace', (req, res) => {
 
    try {
 
        const workspace =
            createWorkspace();
 
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
// Clone Repository Route
// ========================================
 
app.post('/clone', async (req, res) => {
 
    try {
 
        const { repoUrl } = req.body;
 
        const workspace =
            createWorkspace();
 
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

        // ========================================
        // Validation
        // ========================================

        if (!repoUrl) {

            return res.status(400).json({
                success: false,
                message: 'Missing repoUrl'
            });

        }

        // ========================================
        // Check Running Jobs
        // ========================================

        const jobs =
            await getAllJobs();

        const runningJob =
            jobs.find(
                job =>
                    job.status === 'RUNNING'
            );

        if (runningJob) {

            return res.status(400).json({
                success: false,
                message:
                    'Backup already running'
            });

        }

        // ========================================
        // Create Workspace
        // ========================================

        const workspace =
            createWorkspace();

        // ========================================
        // Create Job
        // ========================================

        await createJob(
            workspace.jobId,
            {
                orgAlias,
                repoUrl,
                status: 'PENDING',
                createdAt:
                    new Date().toISOString()
            }
        );

        // ========================================
        // Start Background Job
        // ========================================

        runBackupJob(
            workspace,
            repoUrl,
            orgAlias
        );

        // ========================================
        // Response
        // ========================================

        res.json({
            success: true,
            message:
                'Backup job started',
            jobId:
                workspace.jobId
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
 
        res.json({
            success: true,
            jobs
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
                success: false,
                error: 'Job not found'
            });
 
        }
 
        res.json({
            success: true,
            job
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
 
authenticateOrg();
 
app.listen(3000, () => {
 
    console.log(
        'Server running on port 3000'
    );
 
});
