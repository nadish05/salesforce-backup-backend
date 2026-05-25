const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
        // Create Salesforce DX Project
        // ========================================

        console.log(
            'Creating Salesforce DX Project...'
        );

        execSync(
            'sf project generate --name tempProject',
            {
                cwd: workspace.workspacePath,
                stdio: 'inherit'
            }
        );

        const projectPath = path.join(
            workspace.workspacePath,
            'tempProject'
        );

        console.log(
            'Salesforce DX Project Created'
        );

        // ========================================
        // Create Manifest Folder
        // ========================================

        const manifestDir = path.join(
            projectPath,
            'manifest'
        );

        if (!fs.existsSync(manifestDir)) {

            fs.mkdirSync(
                manifestDir,
                { recursive: true }
            );

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
        <name>AuraDefinitionBundle</name>
    </types>

    <types>
        <members>*</members>
        <name>Flow</name>
    </types>

    <types>
        <members>*</members>
        <name>CustomObject</name>
    </types>

    <types>
        <members>*</members>
        <name>CustomField</name>
    </types>

    <types>
        <members>*</members>
        <name>Layout</name>
    </types>

    <types>
        <members>*</members>
        <name>Profile</name>
    </types>

    <types>
        <members>*</members>
        <name>PermissionSet</name>
    </types>

    <types>
        <members>*</members>
        <name>PermissionSetGroup</name>
    </types>

    <types>
        <members>*</members>
        <name>CustomMetadata</name>
    </types>

    <types>
        <members>*</members>
        <name>ValidationRule</name>
    </types>

    <types>
        <members>*</members>
        <name>RecordType</name>
    </types>

    <types>
        <members>*</members>
        <name>StaticResource</name>
    </types>

    <types>
        <members>*</members>
        <name>EmailTemplate</name>
    </types>

    <types>
        <members>*</members>
        <name>Report</name>
    </types>

    <types>
        <members>*</members>
        <name>Dashboard</name>
    </types>

    <types>
        <members>*</members>
        <name>CustomApplication</name>
    </types>

    <types>
        <members>*</members>
        <name>CustomTab</name>
    </types>

    <types>
        <members>*</members>
        <name>NamedCredential</name>
    </types>

    <types>
        <members>*</members>
        <name>RemoteSiteSetting</name>
    </types>

    <version>66.0</version>

</Package>`;
        fs.writeFileSync(
            path.join(
                manifestDir,
                'package.xml'
            ),
            packageXml
        );

        console.log(
            'Manifest package.xml created'
        );

        // ========================================
        // Retrieve Metadata
        // ========================================

        console.log(
            'Starting Retrieval...'
        );

        await retrieveMetadata(
            projectPath,
            orgAlias
        );

        console.log(
            'Metadata Retrieved'
        );

        // ========================================
        // Copy Retrieved Metadata
        // ========================================

        const sourceForceApp = path.join(
            projectPath,
            'force-app'
        );

        const targetForceApp = path.join(
            workspace.workspacePath,
            'force-app'
        );

        if (fs.existsSync(sourceForceApp)) {

            fs.cpSync(
                sourceForceApp,
                targetForceApp,
                {
                    recursive: true
                }
            );

            console.log(
                'Metadata copied to repository'
            );

        }

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