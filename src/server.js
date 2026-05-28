
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');

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

    saveConnectedOrg

} = require('./salesforceService');

const {
    refreshAccessToken

} = require('./tokenService');

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
// Connect Salesforce Org
// ========================================

app.get(

    '/connect-salesforce',

    async (req, res) => {

        try {

            const {

                environment

            } = req.query;

            // ====================================
            // Login URL
            // ====================================

            const loginUrl =

                environment === 'sandbox'

                    ? 'https://test.salesforce.com'

                    : 'https://login.salesforce.com';

            // ====================================
            // OAuth URL
            // ====================================

            const authUrl =

                `${loginUrl}` +

                `/services/oauth2/authorize` +

                `?response_type=code` +

                `&client_id=${process.env.SF_CLIENT_ID}` +

                `&redirect_uri=${process.env.SF_CALLBACK_URL}`;

            console.log(
                'Redirecting to Salesforce OAuth'
            );

            return res.redirect(authUrl);

        } catch (error) {

            console.error(
                'Connect Salesforce Error:'
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
// OAuth Callback
// ========================================

app.get(

    '/auth/salesforce/callback',

    async (req, res) => {

        try {

            const code =
                req.query.code;

            if (!code) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Authorization code missing'

                });

            }

            // ====================================
            // Exchange Code For Tokens
            // ====================================

            const tokenResponse =
                await axios.post(

                    'https://login.salesforce.com/services/oauth2/token',

                    new URLSearchParams({

                        grant_type:
                            'authorization_code',

                        client_id:
                            process.env.SF_CLIENT_ID,

                        client_secret:
                            process.env.SF_CLIENT_SECRET,

                        redirect_uri:
                            process.env.SF_CALLBACK_URL,

                        code

                    }),

                    {

                        headers: {

                            'Content-Type':
                                'application/x-www-form-urlencoded'

                        }

                    }

                );

            const tokenData =
                tokenResponse.data;

            console.log(
                'OAuth Token Exchange Success'
            );

            // ====================================
            // Fetch User Info
            // ====================================

            const identityResponse =
                await axios.get(

                    `${tokenData.instance_url}` +
                    `/services/oauth2/userinfo`,

                    {

                        headers: {

                            Authorization:
                                `Bearer ${tokenData.access_token}`

                        }

                    }

                );

            const userData =
                identityResponse.data;

            // ====================================
            // Environment
            // ====================================

            const environment =

                tokenData.instance_url.includes(
                    'sandbox'
                )

                    ? 'Sandbox'

                    : 'Production';

            // ====================================
            // Save Connected Org
            // ====================================

            await saveConnectedOrg({

                salesforceBaseUrl:
                    process.env.SALESFORCE_BASE_URL,

                sessionId:
                    process.env.SALESFORCE_SESSION_ID,

                orgId:
                    userData.organization_id,

                orgName:
                    userData.organization_id,

                instanceUrl:
                    tokenData.instance_url,

                refreshToken:
                    tokenData.refresh_token,

                environment

            });

            console.log(
                'Connected Org Persisted'
            );

            return res.send(

                'Salesforce Org Connected Successfully'

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

                connectedOrgId,

                orgName,

                environment,

                instanceUrl,

                refreshToken,

                clientId,

                clientSecret,

                repoUrl

            } = req.body;



            // ====================================
            // Validation
            // ====================================

            if (

                !refreshToken ||

                !instanceUrl ||

                !repoUrl ||

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
            // Create Workspace
            // ====================================

            const workspace =

                await createWorkspace();

            console.log(

                workspace.id,

                'Workspace created'

            );

           
            // ====================================
            // Generate Fresh Access Token
            // ====================================

            const tokenData =

                await refreshAccessToken({

                    clientId,

                    clientSecret,

                    refreshToken,

                    environment

                });

            console.log(
                'Fresh access token generated'
            );

// ====================================
// Auth Data
// ====================================

            const authData = {

                access_token:
                    tokenData.access_token,

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

