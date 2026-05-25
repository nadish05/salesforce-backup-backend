const axios = require("axios");

const SALESFORCE_LOGIN_URL =
    process.env.SALESFORCE_LOGIN_URL || "https://login.salesforce.com";

function getAuthorizationUrl() {

    const params = new URLSearchParams({
        response_type: "code",
        client_id: process.env.SALESFORCE_CLIENT_ID,
        redirect_uri: process.env.SALESFORCE_CALLBACK_URL
    });

    return `${SALESFORCE_LOGIN_URL}/services/oauth2/authorize?${params.toString()}`;
}

async function exchangeCodeForToken(code) {

    const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.SALESFORCE_CLIENT_ID,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET,
        redirect_uri: process.env.SALESFORCE_CALLBACK_URL
    });

    const response = await axios.post(
        `${SALESFORCE_LOGIN_URL}/services/oauth2/token`,
        params,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    );

    return response.data;
}

module.exports = {
    getAuthorizationUrl,
    exchangeCodeForToken
};