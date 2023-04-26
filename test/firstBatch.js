const {ethers} = require("hardhat");
const {perf, MNEMONIC, COUNT} = require("../hardhat.config");
const {getSufficientGasPrice, getTxReceipt} = require("./prepare");

describe("recharge", function () {
    it("recharge the first batch of accounts", async function () {
        const gasPrice = await getSufficientGasPrice(ethers.provider)
        const signers = await ethers.getSigners()
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
