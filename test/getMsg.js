const {ethers} = require("hardhat");

describe("get msg", function () {
    it("get all kinds of blockchain data", async () => {
        const blockNumber = await ethers.provider.getBlockNumber();
        const gasPrice = await getGasPrice(ethers.provider);
        const signers = await ethers.getSigners();
        const weiBalance = await ethers.provider.getBalance(signers[0].address);
        const balance = ethers.utils.formatEther(weiBalance);
        const map = await getTxCount(ethers.provider, blockNumber, 10)
        console.log(`latest block number: ${blockNumber}`);
        console.log(`gas price: ${gasPrice} wei`);
        console.log(`first account balance: ${balance} eth`);
        map.forEach(function (value, key) {
            console.log(`block ${key} tx count: ${value}`)
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