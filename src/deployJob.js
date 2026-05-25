const {
    cloneRepository
} = require('./gitService');

const {
    deployMetadata
} = require('./deployService');

const {
    updateJob
} = require('./jobService');

async function runDeployJob(
    workspace,
    repoUrl,
    orgAlias
) {

    try {

        // ========================================
        // Update Status
        // ========================================

        await updateJob(
            workspace.jobId,
            {
                status: 'RUNNING'
            }
        );

        console.log(
            'Starting Deployment Job...'
        );

        // ========================================
        // Clone Repository
        // ========================================

        console.log(
            'Cloning Repository...'
        );

        await cloneRepository(
            repoUrl,
            workspace.workspacePath
        );

        console.log(
            'Repository Cloned'
        );

        // ========================================
        // Deploy Metadata
        // ========================================

        console.log(
            'Deploying Metadata...'
        );

        await deployMetadata(
            workspace.workspacePath,
            orgAlias
        );

        console.log(
            'Metadata Deployment Completed'
        );

        // ========================================
        // Update Success
        // ========================================

        await updateJob(
            workspace.jobId,
            {
                status: 'SUCCESS'
            }
        );

        console.log(
            `Deploy Job ${workspace.jobId} completed`
        );

    } catch (err) {

        console.error(err);

        // ========================================
        // Update Failed
        // ========================================

        await updateJob(
            workspace.jobId,
            {
                status: 'FAILED',
                error: err.toString()
            }
        );

    }

}

module.exports = {
    runDeployJob
};