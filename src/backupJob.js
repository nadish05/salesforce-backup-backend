const fs = require('fs');
const path = require('path');

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

        await updateJob(
            workspace.jobId,
            {
                status: 'RUNNING'
            }
        );

        console.log('Cloning Repository...');

        // ========================================
        // Clone Repository
        // ========================================

        await cloneRepository(
            repoUrl,
            workspace.workspacePath
        );

        console.log('Repository Cloned');

        // ========================================
        // Create Manifest Folder
        // ========================================

        const manifestDir = path.join(
            workspace.workspacePath,
            'manifest'
        );

        if (!fs.existsSync(manifestDir)) {

            fs.mkdirSync(manifestDir);

        }

        // ========================================
        // Create package.xml
        // ========================================

        const packageXml = `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">

    <types>
        <members>*</members>
        <name>ApexClass</name>
    </types>

    <types>
        <members>*</members>
        <name>ApexTrigger</name>
    </types>

    <types>
        <members>*</members>
        <name>LightningComponentBundle</name>
    </types>

    <types>
        <members>*</members>
        <name>CustomObject</name>
    </types>

    <types>
        <members>*</members>
        <name>Flow</name>
    </types>

    <types>
        <members>*</members>
        <name>Profile</name>
    </types>

    <version>66.0</version>

</Package>`;

        fs.writeFileSync(
            path.join(manifestDir, 'package.xml'),
            packageXml
        );

        console.log(
            'Manifest package.xml created'
        );

        // ========================================
        // Retrieve Metadata
        // ========================================

        console.log('Starting Retrieval...');

        await retrieveMetadata(
            workspace.workspacePath,
            orgAlias
        );

        console.log(
            'Metadata Retrieved'
        );

        // ========================================
        // Push To GitHub
        // ========================================

        console.log(
            'Pushing To GitHub...'
        );

        await pushToGit(
            workspace.workspacePath
        );

        console.log(
            'Git Push Completed'
        );

        // ========================================
        // Mark Success
        // ========================================

        await updateJob(
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
    runBackupJob
};