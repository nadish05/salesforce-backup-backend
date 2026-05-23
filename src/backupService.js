const { exec } = require('child_process');

function runCommand(command, cwd) {

    return new Promise((resolve, reject) => {

        const process = exec(
            command,
            {
                cwd,
                timeout: 300000
            },
            (error, stdout, stderr) => {

                if (error) {
                    reject(stderr || stdout);
                } else {
                    resolve(stdout);
                }

            }
        );

        process.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        process.stderr.on('data', (data) => {
            console.error(data.toString());
        });

    });

}

async function retrieveMetadata(
    workspacePath,
    orgAlias
) {

    console.log('Workspace Path:', workspacePath);

    console.log('Target Org:', orgAlias);

    const command =
        `sf project retrieve start --metadata ApexClass --target-org ${orgAlias}`;

    console.log('Starting Retrieval...');

    const output =
        await runCommand(command, workspacePath);

    console.log('Retrieval Completed');

    console.log(output);

}


module.exports = {
    retrieveMetadata
};