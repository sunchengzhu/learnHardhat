const {ethers, config} = require("hardhat");

describe("get msg", function () {
    it("get block msg", async () => {
        const blockNumber = await ethers.provider.getBlockNumber();
        const gasPrice = await getGasPrice(ethers.provider);
        const bkMap = await getTxCount(ethers.provider, blockNumber, 10)
        console.log(`latest block number: ${blockNumber}`);
        console.log(`gas price: ${gasPrice} wei`);
        bkMap.forEach(function (value, key) {
            console.log(`block ${key} tx count: ${value}`)
        });
    }).timeout(60000)

    it("get account msg", async () => {
        const accounts = config.networks.localhost.accounts;
        const wallet = ethers.Wallet.fromMnemonic(accounts.mnemonic, accounts.path + `/${accounts.initialIndex}`);
        const signers = await ethers.getSigners();
        const requestFnList = signers.map((signer) => () => ethers.provider.getBalance(signer.address))
        const reply = await concurrentRun(requestFnList, 20, "查询所有账户余额");
        console.log(`${wallet.address} private key:${wallet.privateKey}`);
        for (let i = 0; i < reply.length; i++) {
            console.log(`account${i} ${signers[i].address} balance: ${ethers.utils.formatEther(reply[i])} eth`);
        }
    }).timeout(60000)

    it("get random mnemonic", async () => {
        const wallet = ethers.Wallet.createRandom();
        const randomMnemonic = wallet.mnemonic;
        console.log(randomMnemonic);
    }).timeout(30000)
})


async function getGasPrice(provider) {
    const gasPrice = await provider.getGasPrice();
    return parseInt(gasPrice.toHexString().replaceAll("0x0", "0x"), 16);
}

async function getTxCount(provider, blockNumber, blockCount) {
    const map = new Map();
    for (let i = 0; i < blockCount; i++) {
        let txCount = await ethers.provider.send("eth_getBlockTransactionCountByNumber", [
            "0x" + (blockNumber - i).toString(16)
        ])
        map.set((blockNumber - i), parseInt(txCount, 16));
    }
    return map;
}

/**
 * 执行多个异步任务
 * @param {*} fnList 任务列表
 * @param {*} max 最大并发数限制
 * @param {*} taskName 任务名称
 */
async function concurrentRun(fnList = [], max = 5, taskName = "未命名") {
    if (!fnList.length) return;
    console.log(`开始执行多个异步任务，最大并发数： ${max}`);
    const replyList = []; // 收集任务执行结果
    const count = fnList.length; // 总任务数量
    const startTime = new Date().getTime(); // 记录任务执行开始时间
    let current = 0;
    // 任务执行程序
    const schedule = async (index) => {
        return new Promise(async (resolve) => {
            const fn = fnList[index];
            if (!fn) return resolve();
            // 执行当前异步任务
            const reply = await fn();
            replyList[index] = reply;
            // console.log(`${taskName} 事务进度 ${((++current / count) * 100).toFixed(2)}% `);
            // 执行完当前任务后，继续执行任务池的剩余任务
            await schedule(index + max);
            resolve();
        });
    };
    // 任务池执行程序
    const scheduleList = new Array(max)
        .fill(0)
        .map((_, index) => schedule(index));
    // 使用 Promise.all 批量执行
    await Promise.all(scheduleList);
    const cost = (new Date().getTime() - startTime) / 1000;
    console.log(`执行完成，最大并发数： ${max}，耗时：${cost}s`);
    return replyList;
}