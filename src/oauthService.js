const axios = require('axios');

async function exchangeCodeForToken(code) {

    const response =
        await axios.post(
            'https://login.salesforce.com/services/oauth2/token',
            null,
            {
                params: {
                    grant_type: 'authorization_code',
                    client_id:
                        process.env.SALESFORCE_CLIENT_ID,
                    client_secret:
                        process.env.SALESFORCE_CLIENT_SECRET,
                    redirect_uri:
                        process.env.SALESFORCE_CALLBACK_URL,
                    code
                }
            }
        );

    return response.data;

}

function generateAuthUrl() {

    const baseUrl =
        'https://login.salesforce.com/services/oauth2/authorize';

    const params =
        new URLSearchParams({

            response_type: 'code',

            client_id:
                process.env.SALESFORCE_CLIENT_ID,

            redirect_uri:
                process.env.SALESFORCE_CALLBACK_URL

        });

    return `${baseUrl}?${params.toString()}`;

}

module.exports = {

    exchangeCodeForToken,

    generateAuthUrl

};