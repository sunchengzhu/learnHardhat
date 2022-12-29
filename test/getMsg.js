const {ethers} = require("hardhat");

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
        const signers = await ethers.getSigners();
        const acctMap = await getSignersBalance(signers, 20);
        acctMap.forEach(function (value, key) {
            console.log(`${key} balance: ${value}`)
        });
    }).timeout(60000)
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

async function getSignersBalance(signers, signerNum) {
    const map = new Map();
    for (let i = 0; i < signerNum; i++) {
        let weiBalance = await ethers.provider.getBalance(signers[i].address);
        let balance = ethers.utils.formatEther(weiBalance);
        map.set(signers[i].address, balance);
    }
    return map;
}