const simpleGit = require('simple-git');

async function cloneRepository(repoUrl, workspacePath) {

    const git = simpleGit();

    console.log('Cloning Repository...');

    await git.clone(repoUrl, workspacePath);

    console.log('Repository Cloned');

}

async function pushToGit(workspacePath) {

    const git = simpleGit(workspacePath);

    const status = await git.status();

    if (status.files.length === 0) {

        console.log('No changes detected');

        return;
    }

    await git.add('./*');

    await git.commit(
        `Backup ${new Date().toISOString()}`
    );

    await git.push('origin', 'main');

    console.log('Git push successful');

}

module.exports = {
    cloneRepository,
    pushToGit
};