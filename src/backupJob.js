const fs = require('fs');

const path = require('path');




const {
    execSync
} = require('child_process');

const logger =
    require('./utils/logger');

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

    authData = null,

    options = {}

) {

    const {

        orgAlias,

        environment

    } = options;

    console.log(
        'Backup Options:',
        options
    );

    const jobId =
        workspace.jobId;

    logger.createJob(jobId);

    try {

        // ========================================
        // Update Job Status
        // ========================================

        await updateJob(
            jobId,
            {
                status: 'RUNNING'
            }
        );

        logger.addLog(
            jobId,
            'Backup job initialized'
        );

        console.log(
            'Starting Backup Job...'
        );

        // ========================================
        // Clone Repository
        // ========================================

        logger.addLog(
            jobId,
            'Cloning GitHub repository'
        );

        await cloneRepository(
            repoUrl,
            workspace.workspacePath
        );

        logger.addLog(
            jobId,
            'Repository cloned successfully'
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

        logger.addLog(
            jobId,
            'Generating Salesforce DX project'
        );

        execSync(
            `sf project generate --name tempProject`,
            {
                cwd: workspace.workspacePath,
                stdio: 'inherit'
            }
        );

        logger.addLog(
            jobId,
            'Salesforce DX project created'
        );

        console.log(
            'Salesforce DX Project Created'
        );

        // ========================================
        // Authenticate Salesforce Org
        // ========================================

        if (authData) {

            logger.addLog(
                jobId,
                'Authenticating Salesforce org'
            );

            const accessToken =
                authData.access_token;

            const instanceUrl =
                authData.instance_url;

            execSync(

                `echo ${accessToken} | sf org login access-token --instance-url ${instanceUrl} --alias dynamicOrg --set-default`,

                {
                    cwd: workspace.workspacePath,
                    stdio: 'inherit',
                    shell: true
                }

            );

            logger.addLog(
                jobId,
                'Salesforce authentication completed'
            );

            console.log(
                'Salesforce Authentication Completed'
            );

        } else {

    logger.addLog(
        jobId,
        'Skipping CLI authentication'
    );

    console.log(
        'Skipping CLI Authentication'
    );

}

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

        logger.addLog(
            jobId,
            'Manifest folder created'
        );

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

        logger.addLog(
            jobId,
            'package.xml generated'
        );

        // ========================================
        // Retrieve Metadata
        // ========================================

        logger.addLog(
            jobId,
            'Metadata retrieval started'
        );

        await retrieveMetadata(
            projectPath,
            'dynamicOrg'
        );

        logger.addLog(
            jobId,
            'Metadata retrieved successfully'
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

        logger.addLog(
            jobId,
            'Project files copied'
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

        logger.addLog(
            jobId,
            'Temporary project removed'
        );

        // ========================================
        // Push To GitHub
        // ========================================

        logger.addLog(
            jobId,
            'Git push started'
        );

        await pushToGit(
            workspace.workspacePath
        );

        logger.addLog(
            jobId,
            'Git push completed successfully'
        );

        console.log(
            'Git Push Completed'
        );

        // ========================================
        // Update Job Success
        // ========================================

        await updateJob(
            jobId,
            {
                status: 'SUCCESS'
            }
        );

        logger.addLog(
            jobId,
            'Backup completed successfully'
        );

        console.log(
            `Backup Job ${jobId} completed`
        );

    } catch (err) {

        console.error(err);

        logger.addLog(
            jobId,
            `ERROR: ${err.toString()}`
        );

        await updateJob(
            jobId,
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