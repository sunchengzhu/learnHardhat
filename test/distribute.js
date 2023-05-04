const {ethers} = require("hardhat")
const BigNumber = require('bignumber.js');
const {COUNT, INITIALINDEX, MNEMONIC} = require("../hardhat.config");
const {expect} = require("chai");

const accountsNum = parseInt(process.env.ACCOUNTSNUM)
const depositAmount = parseFloat(process.env.DEPOSITAMOUNT)
const interval = COUNT

describe("recharge", async function () {
    it("recharge", async function () {
        const gasPrice = await getSufficientGasPrice(ethers.provider)
        const signers = await ethers.getSigners()
        const addressList = await getAddressList(accountsNum, interval, MNEMONIC)
        if (addressList.length > 1) {
            for (let i = 1; i < addressList.length; i++) {
                const value = ethers.utils.parseUnits((depositAmount * COUNT * 1.2).toString(), "ether").toHexString().replaceAll("0x0", "0x")
                await transferWithReceipt(signers[0].address, addressList[i], gasPrice, value)
                const balance = await ethers.provider.getBalance(addressList[i])
                const count = await ethers.provider.getTransactionCount(addressList[i])
                console.log(`account${i * interval} ${addressList[i]} balance: ${ethers.utils.formatEther(balance)} eth,nonce: ${count}`)
            }
        }
        const balance = await ethers.provider.getBalance(addressList[0])
        const count = await ethers.provider.getTransactionCount(addressList[0])
        console.log(`account0 ${addressList[0]} balance: ${ethers.utils.formatEther(balance)} eth,nonce: ${count}`)
    }).timeout(120000)
})

describe("deposit", function () {
    it("deposit", async function () {
        console.log(`deposit from account${INITIALINDEX}`)
        const gasPrice = await getSufficientGasPrice(ethers.provider)
        const signers = await ethers.getSigners()
        const value = ethers.utils.parseUnits(depositAmount.toString(), "ether").toHexString().replaceAll("0x0", "0x");
        const beginNonce = await ethers.provider.getTransactionCount(signers[0].address)
        for (let i = 1; i < COUNT; i++) {
            try {
                await transfer(signers[0].address, signers[i].address, gasPrice, value, ethers.BigNumber.from(beginNonce + i - 1).toHexString().replaceAll("0x0", "0x"))
            } catch (e) {
                if (e.toString().includes("invalid nonce")) {
                    i--
                } else {
                    console.log(e)
                }
                expect(e.toString()).to.be.contains("invalid nonce")
            }
        }
    }).timeout(600000)
})

describe("withdraw", function () {
    let signers, gasPrice, hdNode
    before(async function () {
        this.timeout(60000);
        signers = await ethers.getSigners()
        gasPrice = await getSufficientGasPrice(ethers.provider)
        hdNode = ethers.utils.HDNode.fromMnemonic(MNEMONIC).derivePath("m/44'/60'/0'/0/0")
    });

    it("withdraw", async function () {
        console.log(`withdraw from account${INITIALINDEX}`)
        const requestFnList = signers.map((signer) => () => ethers.provider.getBalance(signer.address))
        const reply = await concurrentRun(requestFnList, 20, "查询所有账户余额")
        for (let i = 0; i < COUNT; i++) {
            let value = reply[i].sub(ethers.BigNumber.from(21000).mul(gasPrice)).toHexString().replaceAll("0x0", "0x")
            if (ethers.utils.formatEther(value) > 0) {
                await transferWithoutNonce(signers[i].address, hdNode.address, gasPrice, value)
            }
        }
    }).timeout(600000)

    it("transfer all balance", async function () {
        const signer = signers[0].address
        const to = hdNode.address
        const balance = await ethers.provider.getBalance(signer)
        const value = balance.sub(ethers.BigNumber.from(21000).mul(gasPrice)).toHexString().replaceAll("0x0", "0x")
        if (ethers.utils.formatEther(value) > 0) {
            const tx = await ethers.provider.send("eth_sendTransaction", [{
                signer,
                to,
                "gas": "0x5208", //21000
                "gasPrice": gasPrice,
                "value": value
            }])
            await getTxReceipt(ethers.provider, tx, 100)
        }
    }).timeout(60000)
})

describe("check accounts balance", function () {
    let signers, reply, reply1
    before(async function () {
        this.timeout(120000);
        signers = await ethers.getSigners()
        const requestFnList = signers.map((signer) => () => ethers.provider.getBalance(signer.address))
        reply = await concurrentRun(requestFnList, 20, "查询所有账户余额");
        const requestFnList1 = signers.map((signer) => () => ethers.provider.getTransactionCount(signer.address))
        reply1 = await concurrentRun(requestFnList1, 20, "查询所有账户nonce")
    });

    it("after_distribute", async function () {
        let j = 0
        for (let i = 0; i < signers.length; i++) {
            let balance = ethers.utils.formatEther(reply[i])
            if (balance < depositAmount) {
                console.error(`account${i + INITIALINDEX} ${signers[i].address} balance: ${balance} eth < ${depositAmount} eth,nonce: ${reply1[i]}`)
            } else {
                // console.log(`account${i + INITIALINDEX} ${signers[i].address} balance: ${balance} eth,nonce: ${reply1[i]}`)
                j++
            }
        }
        expect(j).to.be.equal(COUNT)
    }).timeout(60000)

    it("after_return", async function () {
        let j = 0
        for (let i = 0; i < signers.length; i++) {
            let balance = ethers.utils.formatEther(reply[i])
            if (i > 0 && balance > 0) {
                console.error(`account${i + INITIALINDEX} ${signers[i].address} balance: ${balance} eth > 0 eth,nonce: ${reply1[i]}`)
            } else {
                // console.log(`account${i + INITIALINDEX} ${signers[i].address} balance: ${balance} eth,nonce: ${reply1[i]}`)
                j++
            }
        }
        expect(j).to.be.equal(COUNT)
    }).timeout(60000)
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
    concurrentRun,
    getTxReceipt
};
