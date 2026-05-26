require('dotenv').config();

const express = require('express');

const cors = require('cors');

const crypto = require('crypto');

const logger =
    require('./utils/logger');

const {
    createWorkspace
} = require('./workspaceService');

const runBackupJob =
    require('./backupJob');

const {
    getJob
} = require('./jobService');

const {

    getAuthorizationUrl,

    exchangeCodeForToken

} = require('./authService');

const app = express();

app.use(cors());

app.use(express.json());

// ========================================
// Temporary OAuth Session Store
// ========================================

const oauthSessions =
    new Map();

// ========================================
// Health Check
// ========================================

app.get('/', (req, res) => {

    return res.json({

        success: true,

        message:
            'Salesforce Git Backup Backend Running'

    });

});

// ========================================
// Start Backup OAuth Flow
// ========================================

app.post(

    '/start-backup',

    async (req, res) => {

        try {

            const {

                clientId,

                clientSecret,

                environment,

                repoUrl

            } = req.body;

            // ====================================
            // Validation
            // ====================================

            if (

                !clientId ||

                !clientSecret ||

                !repoUrl

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Missing required fields'

                });

            }

            // ====================================
            // Create OAuth Session
            // ====================================

            const sessionId =

                crypto.randomUUID();

            oauthSessions.set(

                sessionId,

                {

                    clientId,

                    clientSecret,

                    environment,

                    repoUrl

                }

            );

            // ====================================
            // Generate OAuth URL
            // ====================================

            const authUrl =

                getAuthorizationUrl(

                    clientId,

                    environment

                ) +

                `&state=${sessionId}`;

            return res.json({

                success: true,

                authUrl

            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({

                success: false,

                message:
                    error.message

            });

        }

    }

);

// ========================================
// Salesforce OAuth Callback
// ========================================

app.get(

    '/auth/salesforce/callback',

    async (req, res) => {

        try {

            console.log(
                'OAuth Callback Query:',
                req.query
            );

            const {

                code,

                state,

                error,

                error_description

            } = req.query;

            // ====================================
            // OAuth Error
            // ====================================

            if (error) {

                return res.status(400).json({

                    success: false,

                    error,

                    error_description

                });

            }

            // ====================================
            // Missing Code
            // ====================================

            if (!code) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Authorization code missing'

                });

            }

            // ====================================
            // Invalid Session
            // ====================================

            const sessionData =

                oauthSessions.get(state);

            if (!sessionData) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Invalid OAuth session'

                });

            }

            // ====================================
            // Exchange Token
            // ====================================

            const tokenData =

                await exchangeCodeForToken(

                    code,

                    sessionData.clientId,

                    sessionData.clientSecret,

                    sessionData.environment

                );

            console.log(
                'Salesforce OAuth Success'
            );

            // ====================================
            // Create Workspace
            // ====================================

            const workspace =

                await createWorkspace();

            console.log(
                `Workspace Created: ${workspace.workspacePath}`
            );

            // ====================================
            // Start Backup Job
            // ====================================

            runBackupJob(

                workspace,

                sessionData.repoUrl,

                {

                    access_token:
                        tokenData.access_token,

                    instance_url:
                        tokenData.instance_url

                }

            );

            // ====================================
            // Cleanup Session
            // ====================================

            oauthSessions.delete(state);

            // ====================================
            // Response
            // ====================================

            // ====================================
// Redirect Back To Salesforce
// ====================================

const redirectUrl =

    `${process.env.FRONTEND_URL}` +

    `?jobId=${workspace.jobId}`;

return res.redirect(

    redirectUrl

);

        } catch (error) {

            console.error(
                'OAuth Callback Error:'
            );

            console.error(

                error.response?.data ||

                error.message

            );

            return res.status(500).json({

                success: false,

                message:
                    error.response?.data ||

                    error.message

            });

        }

    }

);

// ========================================
// Live Logs API
// ========================================

app.get(

    '/logs/:jobId',

    (req, res) => {

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

    }

);

// ========================================
// Job Status API
// ========================================

app.get(

    '/jobs/:jobId',

    async (req, res) => {

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

    }

);

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