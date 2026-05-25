const axios = require("axios");

const SALESFORCE_LOGIN_URL =
    process.env.SALESFORCE_LOGIN_URL || "https://login.salesforce.com";

/*
|--------------------------------------------------------------------------
| In-Memory Session Store
|--------------------------------------------------------------------------
*/

const sessions = new Map();

/*
|--------------------------------------------------------------------------
| Generate Salesforce OAuth URL
|--------------------------------------------------------------------------
*/

function getAuthorizationUrl() {

    const params = new URLSearchParams({
            response_type: "code",
            client_id: process.env.SALESFORCE_CLIENT_ID,
            redirect_uri: process.env.SALESFORCE_CALLBACK_URL,
            prompt: "login"
        });

    return `${SALESFORCE_LOGIN_URL}/services/oauth2/authorize?${params.toString()}`;
}

/*
|--------------------------------------------------------------------------
| Exchange Authorization Code for Token
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Store OAuth Session
|--------------------------------------------------------------------------
*/

function storeSession(sessionId, sessionData) {

    sessions.set(sessionId, {
        ...sessionData,
        createdAt: new Date()
    });

    console.log(`Session stored: ${sessionId}`);
}

/*
|--------------------------------------------------------------------------
| Get OAuth Session
|--------------------------------------------------------------------------
*/

function getSession(sessionId) {

    return sessions.get(sessionId);
}

/*
|--------------------------------------------------------------------------
| Delete OAuth Session
|--------------------------------------------------------------------------
*/

function deleteSession(sessionId) {

    sessions.delete(sessionId);

    console.log(`Session deleted: ${sessionId}`);
}

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
    getAuthorizationUrl,
    exchangeCodeForToken,
    storeSession,
    getSession,
    deleteSession
};