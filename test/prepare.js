const {ethers} = require("hardhat")
const BigNumber = require('bignumber.js');
const {COUNT, MNEMONIC, perf} = require("../hardhat.config");
const {expect} = require("chai");
const {getTxReceipt} = require("./getMsg");
const ethValue = "0.01";
const value = ethers.utils.parseUnits(ethValue, "ether").toHexString().replaceAll("0x0", "0x");


describe("prepare", function () {
    let gasPrice, signers
    before(async function () {
        gasPrice = await getSufficientGasPrice(ethers.provider)
        signers = await ethers.getSigners()
    })
    it("deposit to first batch of accounts", async function () {
        const addressList = await getAddressList(perf.accountsNum, perf.interval, MNEMONIC)
        for (let i = 0; i < addressList.length; i++) {
            const value = ethers.utils.parseUnits((perf.depositAmount * COUNT).toString(), "ether").toHexString().replaceAll("0x0", "0x")
            await transferWithReceipt(signers[0].address, addressList[i], gasPrice, value)
            const balance = await ethers.provider.getBalance(addressList[i])
            const count = await ethers.provider.getTransactionCount(addressList[i])
            console.log(`account${i * perf.interval} ${addressList[i]} balance: ${ethers.utils.formatEther(balance)} eth,nonce: ${count}`)
        }
    }).timeout(30000)
    it("deposit", async function () {
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
        for (let i = 1; i < COUNT; i++) {
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
