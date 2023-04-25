const {ethers} = require("hardhat")
const BigNumber = require('bignumber.js');
const {COUNT, MNEMONIC, perf, INITIALINDEX} = require("../hardhat.config");
const {expect} = require("chai");
const {getTxReceipt} = require("./getMsg");


describe("prepare", function () {
    let gasPrice, signers
    before(async function () {
        this.timeout(60000)
        gasPrice = await getSufficientGasPrice(ethers.provider)
        signers = await ethers.getSigners()
    })

    it("deposit to first batch of accounts", async function () {
        const addressList = await getAddressList(perf.accountsNum, perf.interval, MNEMONIC)
        if (addressList.length > 1) {
            for (let i = 1; i < addressList.length; i++) {
                const value = ethers.utils.parseUnits((perf.depositAmount * COUNT).toString(), "ether").toHexString().replaceAll("0x0", "0x")
                await transferWithReceipt(signers[0].address, addressList[i], gasPrice, value)
                const balance = await ethers.provider.getBalance(addressList[i])
                const count = await ethers.provider.getTransactionCount(addressList[i])
                console.log(`account${i * perf.interval} ${addressList[i]} balance: ${ethers.utils.formatEther(balance)} eth,nonce: ${count}`)
            }
        }
        const balance = await ethers.provider.getBalance(addressList[0])
        const count = await ethers.provider.getTransactionCount(addressList[0])
        console.log(`account0 ${addressList[0]} balance: ${ethers.utils.formatEther(balance)} eth,nonce: ${count}`)
    }).timeout(60000)

    it("check accounts balance", async () => {
        const signers = await ethers.getSigners()
        const requestFnList = signers.map((signer) => () => ethers.provider.getBalance(signer.address))
        const reply = await concurrentRun(requestFnList, 50, "查询所有账户余额");
        const requestFnList1 = signers.map((signer) => () => ethers.provider.getTransactionCount(signer.address))
        const reply1 = await concurrentRun(requestFnList1, 50, "查询所有账户nonce")
        for (let i = 0; i < signers.length; i++) {
            let balance = ethers.utils.formatEther(reply[i])
            if (balance < perf.depositAmount) {
                console.error(`account${i + INITIALINDEX} ${signers[i].address} balance: ${balance} eth < ${perf.depositAmount} eth,nonce: ${reply1[i]}`)
            } else {
                console.log(`account${i + INITIALINDEX} ${signers[i].address} balance: ${balance} eth,nonce: ${reply1[i]}`)
            }
        }
    }).timeout(300000)

    it("deposit", async function () {
        const value = ethers.utils.parseUnits((perf.depositAmount).toString(), "ether").toHexString().replaceAll("0x0", "0x");
        const beginNonce = await ethers.provider.getTransactionCount(signers[0].address)
        for (let i = 1; i < COUNT; i++) {
            try {
                await transfer(signers[0].address, signers[i].address, gasPrice, value, ethers.BigNumber.from(beginNonce + i - 1).toHexString().replaceAll("0x0", "0x"))
            } catch (e) {
                expect(e.toString()).to.be.contains("invalid nonce")
                i--
            }
        }
    }).timeout(600000)

    it("withdraw", async function () {
        for (let i = 0; i < COUNT; i++) {
            let balance = await ethers.provider.getBalance(signers[i].address)
            let value = balance.sub(ethers.BigNumber.from(21000).mul(ethers.BigNumber.from(gasPrice))).toHexString().replaceAll("0x0", "0x")
            await transferWithoutNonce(signers[i].address, signers[0].address, gasPrice, value)
        }
    }).timeout(600000)
})


async function getAddressList(accountsNum, interval, mnemonic) {
    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic)
    let addressList = []
    if (accountsNum > interval) {
        const loopCount = Math.floor(accountsNum / interval)
        for (let i = 0; i < loopCount; i++) {
            let hdNodeNew = hdNode.derivePath("m/44'/60'/0'/0/" + i * interval)
            addressList.push(hdNodeNew.address)
        }
    }
    return addressList
}

async function transfer(from, to, gasPrice, value, nonce) {
    await ethers.provider.send("eth_sendTransaction", [{
        from,
        to,
        "gas": "0xc738", //51000
        "gasPrice": gasPrice,
        "value": value,
        "nonce": nonce
    }])
}

async function transferWithoutNonce(from, to, gasPrice, value) {
    await ethers.provider.send("eth_sendTransaction", [{
        from,
        to,
        "gas": "0x5208", //21000
        "gasPrice": gasPrice,
        "value": value
    }])
}

async function transferWithReceipt(from, to, gasPrice, value) {
    const tx = await ethers.provider.send("eth_sendTransaction", [{
        from,
        to,
        "gas": "0xc738",
        "gasPrice": gasPrice,
        "value": value,
    }])
    await getTxReceipt(ethers.provider, tx, 100)
}

async function getSufficientGasPrice(provider) {
    const gasPrice = await provider.getGasPrice()
    console.log(`gas price: ${gasPrice} wei`)
    const myGasPrice = new BigNumber(gasPrice.toNumber()).multipliedBy(1.2).decimalPlaces(0)
    console.log(`my gas price: ${myGasPrice} wei`)
    const hexPrice = ethers.BigNumber.from(myGasPrice.toNumber()).toHexString().replaceAll("0x0", "0x")
    return hexPrice
}

/**
 * 执行多个异步任务
 * @param {*} fnList 任务列表
 * @param {*} max 最大并发数限制
 * @param {*} taskName 任务名称
 */
async function concurrentRun(fnList = [], max = 5, taskName = "未命名") {
    if (!fnList.length) return;
    // console.log(`开始执行多个异步任务，最大并发数： ${max}`);
    const replyList = []; // 收集任务执行结果
    // const count = fnList.length; // 总任务数量
    // const startTime = new Date().getTime(); // 记录任务执行开始时间
    // let current = 0;
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
    // const cost = (new Date().getTime() - startTime) / 1000;
    // console.log(`执行完成，最大并发数： ${max}，耗时：${cost}s`);
    return replyList;
}
