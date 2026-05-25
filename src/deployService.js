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
                        'Deploy Command Failed'
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

async function deployMetadata(
    workspacePath,
    orgAlias
) {

    try {

        console.log(
            'Starting Deployment...'
        );

        const command =
            `sf project deploy start --target-org "${orgAlias}"`;

        const output =
            await runCommand(
                command,
                workspacePath
            );

        console.log(
            'Deployment Completed'
        );

        console.log(output);

        return output;

    } catch (err) {

        console.error(
            'Deployment Failed'
        );

        console.error(err);

        throw err;

    }

}

module.exports = {
    deployMetadata
};