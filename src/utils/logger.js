const logs = {};

function createJob(jobId) {

    logs[jobId] = [];

}

function addLog(jobId, message) {

    if (!logs[jobId]) {

        logs[jobId] = [];

    }

    logs[jobId].push(message);

}

function getLogs(jobId) {

    return logs[jobId] || [];

}

module.exports = {

    createJob,
    addLog,
    getLogs

};