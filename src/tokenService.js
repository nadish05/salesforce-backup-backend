
const axios = require('axios');

// ========================================
// Refresh Salesforce Access Token
// ========================================

async function refreshAccessToken({

    clientId,

    clientSecret,

    refreshToken,

    environment

}) {

    try {

        // ====================================
        // Token Endpoint
        // ====================================

        const tokenUrl =

            environment === 'sandbox'

                ? 'https://test.salesforce.com/services/oauth2/token'

                : 'https://login.salesforce.com/services/oauth2/token';

        // ====================================
        // Request New Access Token
        // ====================================

        const params =

            new URLSearchParams();

        params.append(

            'grant_type',

            'refresh_token'

        );

        params.append(

            'client_id',

            clientId

        );

        params.append(

            'client_secret',

            clientSecret

        );

        params.append(

            'refresh_token',

            refreshToken

        );

        const response =

            await axios.post(

                tokenUrl,

                params,

                {

                    headers: {

                        'Content-Type':
                            'application/x-www-form-urlencoded'

                    }

                }

            );

        console.log(
            'Access token refreshed'
        );

        return response.data;

    } catch (error) {

        console.error(
            'Refresh Token Error:'
        );

        console.error(

            error.response?.data ||

            error.message

        );

        throw error;

    }

}

module.exports = {

    refreshAccessToken

};

