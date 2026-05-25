const simpleGit = require('simple-git');

async function cloneRepository(
    repoUrl,
    workspacePath
) {

    const git = simpleGit();

    console.log(
        'Cloning Repository...'
    );

    const token =
        process.env.GITHUB_TOKEN;

    if (!token) {

        throw new Error(
            'Missing GITHUB_TOKEN'
        );

    }

    const authenticatedRepoUrl =
        repoUrl.replace(
            'https://',
            `https://${token}@`
        );

    await git.clone(
        authenticatedRepoUrl,
        workspacePath
    );

    console.log(
        'Repository Cloned'
    );

}

async function pushToGit(
    workspacePath
) {

    const git =
        simpleGit(workspacePath);

    await git.addConfig(
        'user.name',
        'Salesforce Backup Bot'
    );

    await git.addConfig(
        'user.email',
        'backupbot@example.com'
    );

    const status =
        await git.status();

    if (
        status.files.length === 0
    ) {

        console.log(
            'No changes detected'
        );

        return;

    }

    await git.add('.');

    await git.commit(
        `Backup ${new Date().toISOString()}`
    );

    await git.push(
        'origin',
        'main'
    );

    console.log(
        'Git Push Successful'
    );

}

module.exports = {
    cloneRepository,
    pushToGit
};