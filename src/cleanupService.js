const fs = require('fs-extra');

const path = require('path');

const tempPath = path.join(
    __dirname,
    '../temp'
);

async function cleanupOldWorkspaces() {

    console.log(
        'Starting workspace cleanup...'
    );

    const folders =
        await fs.readdir(tempPath);

    const now = Date.now();

    for (const folder of folders) {

        const folderPath =
            path.join(tempPath, folder);

        const stats =
            await fs.stat(folderPath);

        const createdTime =
            new Date(stats.birthtime).getTime();

        const ageInMinutes =
            (now - createdTime) / 1000 / 60;

        // Delete folders older than 30 minutes
        if (ageInMinutes > 30) {

            console.log(
                `Deleting workspace: ${folder}`
            );

            await fs.remove(folderPath);

        }

    }

    console.log(
        'Workspace cleanup completed'
    );

}

module.exports = {
    cleanupOldWorkspaces
};