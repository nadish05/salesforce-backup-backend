
require('dotenv').config();

const express = require('express');
const cors = require('cors');

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

const app = express();

app.use(cors());

app.use(express.json());

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
// Execute Backup
// ========================================

app.post(

    '/execute-backup',

    async (req, res) => {

        try {

            const {

                connectedOrgId,

                orgName,

                environment,

                instanceUrl,

                accessToken,

                repoUrl

            } = req.body;

            // ====================================
            // Validation
            // ====================================

            if (

                !accessToken ||

                !instanceUrl ||

                !repoUrl

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Missing required fields'

                });

            }

            // ====================================
            // Create Workspace
            // ====================================

            const workspace =

                await createWorkspace();

            logger.log(

                workspace.id,

                'Workspace created'

            );

            // ====================================
            // Auth Data
            // ====================================

            const authData = {

                access_token:
                    accessToken,

                instance_url:
                    instanceUrl

            };

            // ====================================
            // Execute Backup Job
            // ====================================

            runBackupJob(

                workspace,

                repoUrl,

                authData,

                {

                    connectedOrgId,

                    orgName,

                    environment

                }

            );

            // ====================================
            // Response
            // ====================================

            return res.json({

                success: true,

                jobId:
                    workspace.id

            });

        } catch (error) {

            console.error(
                'Execute Backup Error:'
            );

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
// Get Logs
// ========================================

app.get(

    '/logs/:jobId',

    (req, res) => {

        try {

            const jobId =
                req.params.jobId;

            const logs =
                getJob(jobId);

            return res.json({

                success: true,

                logs:
                    logs || []

            });

        } catch (error) {

            console.error(
                'Get Logs Error:'
            );

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
// Start Server
// ========================================

const PORT =

    process.env.PORT || 3000;

app.listen(

    PORT,

    () => {

        console.log(

            `Server running on port ${PORT}`

        );

    }

);

