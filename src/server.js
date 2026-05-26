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
// OAuth Temporary Sessions
// ========================================

const oauthSessions =
    new Map();

// ========================================
// Connected Org Sessions
// ========================================

const connectedOrgs =
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
// Connect Salesforce
// ========================================

app.post(

    '/connect-salesforce',

    async (req, res) => {

        try {

            const {

                clientId,

                clientSecret,

                environment

            } = req.body;

            if (

                !clientId ||

                !clientSecret

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

                    environment

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
// OAuth Callback
// ========================================

app.get(

    '/auth/salesforce/callback',

    async (req, res) => {

        try {

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
            // Get Session
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
            // Store Connected Org
            // ====================================

            connectedOrgs.set(

                state,

                {

                    accessToken:
                        tokenData.access_token,

                    instanceUrl:
                        tokenData.instance_url,

                    connected:
                        true

                }

            );

            // ====================================
            // Cleanup OAuth Session
            // ====================================

            oauthSessions.delete(state);

            // ====================================
            // Redirect Back To LWC
            // ====================================

            const redirectUrl =

                `${process.env.FRONTEND_URL}` +

                `?connected=true` +

                `&sessionId=${state}`;

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
// Execute Backup
// ========================================

app.post(

    '/execute-backup',

    async (req, res) => {

        try {

            const {

                sessionId,

                repoUrl

            } = req.body;

            if (

                !sessionId ||

                !repoUrl

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Missing required fields'

                });

            }

            // ====================================
            // Get Connected Org
            // ====================================

            const orgSession =

                connectedOrgs.get(sessionId);

            if (!orgSession) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Org session expired'

                });

            }

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

                repoUrl,

                {

                    access_token:
                        orgSession.accessToken,

                    instance_url:
                        orgSession.instanceUrl

                }

            );

            return res.json({

                success: true,

                message:
                    'Backup Started',

                jobId:
                    workspace.jobId

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
// Logs API
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