require('dotenv').config();

const express = require('express');

const cors = require('cors');

const crypto = require('crypto');

const logger =
require('./utils/logger');

const {
    createWorkspace
} = require('./workspaceService');

const {
    runBackupJob
} = require('./backupJob');

const {
    runDeployJob
} = require('./deployJob');

const {
    getJob
} = require('./jobService');

const {
    getAuthorizationUrl,
    exchangeCodeForToken,
    storeSession,
    getSession
} = require('./authService');

const app = express();

app.use(cors());

app.use(express.json());


// ========================================
// Health Check
// ========================================

app.get('/', (req, res) => {

    res.json({

        success: true,

        message:
            'Salesforce Git Backup Backend Running'

    });

});


// ========================================
// Salesforce OAuth Login
// ========================================

app.get('/auth/salesforce', (req, res) => {

    try {

        const authUrl =
            getAuthorizationUrl();

        return res.redirect(authUrl);

    } catch (error) {

        console.error(
            'OAuth Start Error:',
            error
        );

        return res.status(500).json({

            success: false,

            message:
                'Failed to start Salesforce OAuth'

        });

    }

});


// ========================================
// Salesforce OAuth Callback
// ========================================

app.get('/auth/salesforce/callback', async (req, res) => {

    try {

        console.log(
    'OAuth Callback Query:',
    req.query
);

const {

    code,
    error,
    error_description

} = req.query;

if (error) {

    return res.status(400).json({

        success: false,

        error,

        error_description

    });

}

if (!code) {

    return res.status(400).json({

        success: false,

        message:
            'Authorization code missing',

        query:
            req.query

    });

}

        // ========================================
        // Exchange Token
        // ========================================

        const tokenData =
            await exchangeCodeForToken(code);

        // ========================================
        // Create Session
        // ========================================

        const sessionId =
            crypto.randomUUID();

        storeSession(sessionId, {

            access_token:
                tokenData.access_token,

            refresh_token:
                tokenData.refresh_token,

            instance_url:
                tokenData.instance_url

        });

        console.log(
            `Salesforce session created: ${sessionId}`
        );

        // ========================================
        // Response
        // ========================================

        return res.json({

            success: true,

            message:
                'Salesforce connected successfully',

            sessionId,

            orgUrl:
                tokenData.instance_url

        });

    } catch (error) {

        console.error(
            'OAuth Callback Error:'
        );

        console.error(
            error.response?.data || error.message
        );

        return res.status(500).json({

            success: false,

            message:
                'OAuth callback failed'

        });

    }

});


// ========================================
// Start Backup
// ========================================

app.post('/start-backup', async (req, res) => {

    try {

        const {
            repoUrl,
            sessionId
        } = req.body;

        // ========================================
        // Validation
        // ========================================

        if (!repoUrl) {

            return res.status(400).json({

                success: false,

                message:
                    'Repository URL is required'

            });

        }

        if (!sessionId) {

            return res.status(400).json({

                success: false,

                message:
                    'Session ID is required'

            });

        }

        // ========================================
        // Get Salesforce Session
        // ========================================

        const session =
            getSession(sessionId);

        if (!session) {

            return res.status(401).json({

                success: false,

                message:
                    'Invalid or expired Salesforce session'

            });

        }

        // ========================================
        // Create Workspace
        // ========================================

        const workspace =
            await createWorkspace();

        console.log(
            `Workspace Created: ${workspace.workspacePath}`
        );

        // ========================================
        // Start Backup Job
        // ========================================

        runBackupJob(

            workspace,
            repoUrl,
            session

        );

        // ========================================
        // Response
        // ========================================

        return res.json({

            success: true,

            message:
                'Backup job started',

            jobId:
                workspace.jobId

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message:
                'Failed to start backup'

        });

    }

});


// ========================================
// LIVE LOGS API
// ========================================

app.get('/logs/:jobId', (req, res) => {

    try {

        const jobId =
            req.params.jobId;

        const logs =
            logger.getLogs(jobId);

        return res.json({

            success: true,

            logs

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message:
                'Failed to fetch logs'

        });

    }

});


// ========================================
// Deploy Metadata
// ========================================

app.post('/deploy', async (req, res) => {

    try {

        const {
            repoUrl,
            orgAlias
        } = req.body;

        if (!repoUrl || !orgAlias) {

            return res.status(400).json({

                success: false,

                message:
                    'repoUrl and orgAlias are required'

            });

        }

        const workspace =
            await createWorkspace();

        console.log(
            `Workspace Created: ${workspace.workspacePath}`
        );

        runDeployJob(

            workspace,
            repoUrl,
            orgAlias

        );

        return res.json({

            success: true,

            message:
                'Deployment started',

            jobId:
                workspace.jobId

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message:
                'Failed to start deployment'

        });

    }

});


// ========================================
// Get Job Status
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

                message:
                    'Job not found'

            });

        }

        return res.json({

            success: true,

            job

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message:
                'Failed to fetch job status'

        });

    }

});


// ========================================
// Start Server
// ========================================

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});