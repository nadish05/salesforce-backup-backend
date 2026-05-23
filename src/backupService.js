const { exec } = require('child_process');

function runCommand(command, cwd) {

    return new Promise((resolve, reject) => {

        const child = exec(
            command,
            {
                cwd,
                timeout: 300000,
                maxBuffer: 1024 * 1024 * 50
            },
            (error, stdout, stderr) => {

                if (error) {

                    console.error(
                        'Command Failed'
                    );

                    console.error(stderr);

                    return reject(
                        stderr || stdout || error.message
                    );

                }

                resolve(stdout);

            }
        );

        child.stdout.on(
            'data',
            (data) => {

                console.log(
                    data.toString()
                );

            }
        );

        child.stderr.on(
            'data',
            (data) => {

                console.error(
                    data.toString()
                );

            }
        );

    });

}

async function retrieveMetadata(
    workspacePath,
    orgAlias
) {

    try {

        console.log(
            'Workspace Path:',
            workspacePath
        );

        console.log(
            'Target Org:',
            orgAlias
        );

        // ========================================
        // Salesforce Retrieve Command
        // ========================================

        const command =
            `sf project retrieve start --manifest manifest/package.xml --target-org "${orgAlias}"`;

        console.log(
            'Starting Retrieval...'
        );

        const output =
            await runCommand(
                command,
                workspacePath
            );

        console.log(
            'Retrieval Completed'
        );

        console.log(output);

        return output;

    } catch (err) {

        console.error(
            'Metadata Retrieval Failed'
        );

        console.error(err);

        throw err;

    }

}

module.exports = {
    retrieveMetadata
};