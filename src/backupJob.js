const fs = require('fs');
const path = require('path');

const {
    execSync
} = require('child_process');

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
    session
) {

    try {

        // ========================================
        // Update Job Status
        // ========================================

        await updateJob(
            workspace.jobId,
            {
                status: 'RUNNING'
            }
        );

        console.log(
            'Starting Backup Job...'
        );

        // ========================================
        // Clone Repository
        // ========================================

        await cloneRepository(
            repoUrl,
            workspace.workspacePath
        );

        console.log(
            'Repository Cloned'
        );

        // ========================================
        // Generate Salesforce DX Project
        // ========================================

        const projectPath = path.join(
            workspace.workspacePath,
            'tempProject'
        );

        console.log(
            'Generating Salesforce DX Project...'
        );

        execSync(
            `sf project generate --name tempProject`,
            {
                cwd: workspace.workspacePath,
                stdio: 'inherit'
            }
        );

        console.log(
            'Salesforce DX Project Created'
        );

        // ========================================
        // Authenticate Salesforce Org Dynamically
        // ========================================

        console.log(
            'Authenticating Salesforce Org...'
        );

        const accessToken =
            session.access_token;

        const instanceUrl =
            session.instance_url;

        execSync(

            `echo ${accessToken} | sf org login access-token --instance-url ${instanceUrl} --alias dynamicOrg --set-default`,

            {
                cwd: workspace.workspacePath,
                stdio: 'inherit',
                shell: true
            }

        );

        console.log(
            'Dynamic Salesforce Authentication Completed'
        );

        // ========================================
        // Create Manifest Folder
        // ========================================

        const manifestDir = path.join(
            projectPath,
            'manifest'
        );

        if (
            !fs.existsSync(manifestDir)
        ) {

            fs.mkdirSync(
                manifestDir,
                {
                    recursive: true
                }
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
        <name>CustomMetadata</name>
    </types>

    <types>
        <members>*</members>
        <name>StaticResource</name>
    </types>

    <types>
        <members>*</members>
        <name>Report</name>
    </types>

    <types>
        <members>*</members>
        <name>Dashboard</name>
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
            'package.xml created'
        );

        // ========================================
        // Retrieve Metadata
        // ========================================

        await retrieveMetadata(
            projectPath,
            'dynamicOrg'
        );

        console.log(
            'Metadata Retrieved'
        );

        // ========================================
        // Copy Project Contents To Repo Root
        // ========================================

        const tempFiles =
            fs.readdirSync(projectPath);

        for (const file of tempFiles) {

            if (
                file === '.git'
            ) {
                continue;
            }

            const source =
                path.join(projectPath, file);

            const destination =
                path.join(
                    workspace.workspacePath,
                    file
                );

            fs.cpSync(
                source,
                destination,
                {
                    recursive: true
                }
            );

        }

        console.log(
            'Project Files Copied'
        );

        // ========================================
        // Remove Temporary Project
        // ========================================

        fs.rmSync(
            projectPath,
            {
                recursive: true,
                force: true
            }
        );

        console.log(
            'Temporary Project Removed'
        );

        // ========================================
        // Push To GitHub
        // ========================================

        await pushToGit(
            workspace.workspacePath
        );

        console.log(
            'Git Push Completed'
        );

        // ========================================
        // Update Job Success
        // ========================================

        await updateJob(
            workspace.jobId,
            {
                status: 'SUCCESS'
            }
        );

        console.log(
            `Backup Job ${workspace.jobId} completed`
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