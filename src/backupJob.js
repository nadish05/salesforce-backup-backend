const {
    cloneRepository,
    pushToGit
} = require('./gitService');

const {
    retrieveMetadata
} = require('./backupService');

const {
    updateJob
} = require('./jobService');

async function runBackupJob(
    workspace,
    repoUrl,
    orgAlias
) {

    try {
        updateJob(
            workspace.jobId,
            {
                status: 'RUNNING'
            }
        );

        // Clone Repository
        await cloneRepository(
            repoUrl,
            workspace.workspacePath
        );

        // Retrieve Metadata
        await retrieveMetadata(
            workspace.workspacePath,
            orgAlias
        );

        // Push To GitHub
        await pushToGit(
            workspace.workspacePath
        );

        // Mark Success
        updateJob(
            workspace.jobId,
            {
                status: 'SUCCESS'
            }
        );

        console.log(
            `Job ${workspace.jobId} completed`
        );

    } catch (err) {

        console.error(err);

        updateJob(
            workspace.jobId,
            {
                status: 'FAILED',
                error: err.toString()
            }
        );

    }

}

module.exports = {
    runBackupJob
};