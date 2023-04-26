const {ethers} = require("hardhat")
const BigNumber = require('bignumber.js');
const {COUNT, perf, INITIALINDEX} = require("../hardhat.config");
const {expect} = require("chai");

describe("deposit", function () {
    it("deposit to each account", async function () {
        const signers = await ethers.getSigners()
        const gasPrice = await getSufficientGasPrice(ethers.provider)
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
        console.log("sleep 10s")
        await sleep(10000)
    }).timeout(600000)

    it("check accounts balance", async function () {
        const signers = await ethers.getSigners()
        const requestFnList = signers.map((signer) => () => ethers.provider.getBalance(signer.address))
        const reply = await concurrentRun(requestFnList, 20, "查询所有账户余额");
        const requestFnList1 = signers.map((signer) => () => ethers.provider.getTransactionCount(signer.address))
        const reply1 = await concurrentRun(requestFnList1, 20, "查询所有账户nonce")
        let j = 0
        for (let i = 0; i < signers.length; i++) {
            let balance = ethers.utils.formatEther(reply[i])
            if (balance < perf.depositAmount) {
                console.error(`account${i + INITIALINDEX} ${signers[i].address} balance: ${balance} eth < ${perf.depositAmount} eth,nonce: ${reply1[i]}`)
            } else {
                console.log(`account${i + INITIALINDEX} ${signers[i].address} balance: ${balance} eth,nonce: ${reply1[i]}`)
                j++
            }
        }
        expect(j).to.be.equal(COUNT)
    }).timeout(180000)


})

describe("withdraw", function () {
    it("withdraw", async function () {
        const signers = await ethers.getSigners()
        const gasPrice = await getSufficientGasPrice(ethers.provider)
        const requestFnList = signers.map((signer) => () => ethers.provider.getBalance(signer.address))
        const reply = await concurrentRun(requestFnList, 50, "查询所有账户余额")
        for (let i = 0; i < COUNT; i++) {
            let value = reply[i].sub(ethers.BigNumber.from(21000).mul(gasPrice)).toHexString().replaceAll("0x0", "0x")
            if (ethers.utils.formatEther(value) > 0) {
                await transferWithoutNonce(signers[i].address, signers[0].address, gasPrice, value)
            }
        }
    }).timeout(600000)
})

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


async function getTxReceipt(provider, txHash, count) {
    let response
    for (let i = 0; i < count; i++) {
        response = await provider.getTransactionReceipt(txHash)
        if (response == null) {
            await sleep(2000)
            continue
        }
        if (response.confirmations >= 1) {
            return response
        }
        await sleep(2000)
    }
    return response
}

async function sleep(timeOut) {
    await new Promise(r => setTimeout(r, timeOut));
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

module.exports = {
    getSufficientGasPrice,
    concurrentRun,
    getTxReceipt
};
