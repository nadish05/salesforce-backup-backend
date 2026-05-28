const axios = require('axios');

// ========================================
// Save Connected Org To Salesforce
// ========================================

async function saveConnectedOrg({

    salesforceBaseUrl,

    sessionId,

    orgId,

    orgName,

    instanceUrl,

    refreshToken,

    environment

}) {

    try {

        const response = await axios.post(

            `${salesforceBaseUrl}` +
            `/services/apexrest/connectedorg`,

            {

                orgId,

                orgName,

                instanceUrl,

                refreshToken,

                environment

            },

            {

                headers: {

                    Authorization:
                        `Bearer ${sessionId}`,

                    'Content-Type':
                        'application/json'

                }

            }

        );

        console.log(
            'Connected Org Saved:',
            response.data
        );

        return response.data;

    } catch (error) {

        console.error(
            'Save Connected Org Error:'
        );

        console.error(

            error.response?.data ||

            error.message

        );

        throw error;

    }

}

module.exports = {

    saveConnectedOrg

};