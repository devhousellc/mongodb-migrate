const readLine = require('readline');


function askQuestion(message, argsManager) {
    const rl = readLine.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve, reject) => {
        if (argsManager.findArg('--silence')) {
            resolve();
            return;
        }

        rl.question(message + ' [y/n]: ',
            (answer) => {
                if (answer === 'y' || answer === 'yes') {
                    resolve();
                    rl.close();
                } else {
                    reject('declined by user');
                    rl.close();
                }

            })
    });

}

module.exports = {
    askQuestion
};