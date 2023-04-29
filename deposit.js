const {exec, spawn} = require('child_process');

exec('npx hardhat clean', (error, stdout, stderr) => {
    if (error) {
        console.error(error);
        return;
    }
    console.log(stdout);
    console.log(stderr);
})

const processNum = 5
for (let i = 0; i < processNum; i++) {
    const test = spawn('npx', ['hardhat', 'test', '--grep', 'deposit to each account', '--network', process.argv[2]], {
        env: {
            ...process.env,
            INITIALINDEX: `${i * 1000}`
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


