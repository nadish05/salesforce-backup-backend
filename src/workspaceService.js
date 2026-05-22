const fs = require('fs');
const path = require('path');

const { v4: uuidv4 } = require('uuid');

function createWorkspace() {

    const jobId = uuidv4();

    const workspacePath = path.join(
        __dirname,
        '../temp',
        jobId
    );

    fs.mkdirSync(workspacePath, {
        recursive: true
    });

    console.log('Workspace Created:', workspacePath);

    return {
        jobId,
        workspacePath
    };

}

module.exports = {
    createWorkspace
};