const simpleGit = require('simple-git');
 
async function cloneRepository(
    repoUrl,
    workspacePath
) {
 
    const git = simpleGit();
 
    console.log(
        'Cloning Repository...'
    );
 
    // ========================================
    // Inject GitHub Token
    // ========================================
 
    const token =
        process.env.GITHUB_TOKEN;
 
    if (!token) {
 
        throw new Error(
            'Missing GITHUB_TOKEN environment variable'
        );
 
    }
 
    const authenticatedRepoUrl =
        repoUrl.replace(
            'https://',
            `https://${token}@`
        );
 
    // ========================================
    // Clone Repository
    // ========================================
 
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
 
    // ========================================
    // Configure Git Identity
    // ========================================
 
    await git.addConfig(
        'user.name',
        'Salesforce Backup Bot'
    );
 
    await git.addConfig(
        'user.email',
        'backupbot@example.com'
    );
 
    // ========================================
    // Check Git Status
    // ========================================
 
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
 
    // ========================================
    // Git Add
    // ========================================
 
    await git.add('./*');
 
    // ========================================
    // Git Commit
    // ========================================
 
    await git.commit(
        `Backup ${new Date().toISOString()}`
    );
 
    // ========================================
    // Git Push
    // ========================================
 
    await git.push(
        'origin',
        'main'
    );
 
    console.log(
        'Git push successful'
    );
 
}
 
module.exports = {
    cloneRepository,
    pushToGit
};