const {spawn} = require('child_process');
require('dotenv').config()

const processNum = parseInt(process.argv[2])
const fromIndex = parseInt(process.argv[3])
for (let i = (0 + fromIndex); i < (processNum + fromIndex); i++) {
    const test = spawn('npx', ['hardhat', 'test', '--grep', process.argv[4], '--network', process.argv[5]], {
        env: {
            ...process.env,
            INITIALINDEX: `${i * process.env.COUNT}`
        }
    });
    test.stdout.on('data', (data) => {
        console.log(`${data}`);
    });
    test.stderr.on('data', (data) => {
        console.error(`${data}`);
    });
    test.on('close', (code) => {
        console.log(`child_process_${i} exited with code ${code}`);
    });
}


