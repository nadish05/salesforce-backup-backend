const axios = require('axios');

// ========================================
// Login URL
// ========================================

function getLoginUrl(environment) {

    return environment === 'sandbox'

        ? 'https://test.salesforce.com'

        : 'https://login.salesforce.com';

}

// ========================================
// Generate Authorization URL
// ========================================

function getAuthorizationUrl(

    clientId,
    environment

) {

    const loginUrl =
        getLoginUrl(environment);

    const params =
        new URLSearchParams({

            response_type: 'code',

            client_id:
                clientId,

            redirect_uri:
                process.env
                    .SALESFORCE_CALLBACK_URL

        });

    return `${loginUrl}/services/oauth2/authorize?${params.toString()}`;

}

// ========================================
// Exchange Code For Token
// ========================================

async function exchangeCodeForToken(

    code,
    clientId,
    clientSecret,
    environment

) {

    const loginUrl =
        getLoginUrl(environment);

    const params =
        new URLSearchParams({

            grant_type:
                'authorization_code',

            code,

            client_id:
                clientId,

            client_secret:
                clientSecret,

            redirect_uri:
                process.env
                    .SALESFORCE_CALLBACK_URL

        });

    const response =
        await axios.post(

            `${loginUrl}/services/oauth2/token`,

            params,

            {

                headers: {

                    'Content-Type':
                        'application/x-www-form-urlencoded'

                }

            }

        );

    return response.data;

}

module.exports = {

    getAuthorizationUrl,

    exchangeCodeForToken

};