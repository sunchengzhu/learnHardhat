const {ethers} = require("hardhat");
const {MNEMONIC} = require("../hardhat.config");

describe("get msg", function () {
    it("get block msg", async () => {
        const blockNumber = await ethers.provider.getBlockNumber()
        const gasPrice = await getGasPrice(ethers.provider)
        console.log(`latest block number: ${blockNumber}`)
        console.log(`gas price: ${gasPrice} wei`)
    }).timeout(30000)

    it("get an account msg", async () => {
        const address = "0x78b31C9D6ACaa8AD23B8bcab5E5D5ea438E169f0"
        const balance = await ethers.provider.getBalance(address)
        const count = await ethers.provider.getTransactionCount(address)
        console.log(`${address} balance: ${ethers.utils.formatEther(balance)} eth,nonce: ${count}`)
    }).timeout(30000)

    it("get receipt by txHash", async () => {
        const txHash = "0x7d6fcc85fb2c22c60c4cbbc7dee6baf341fdd27984685fad66c129e82ac795c0"
        const txReceipt = await getTxReceipt(ethers.provider, txHash, 100)
        console.log(txReceipt)
    }).timeout(30000)

    it("get random mnemonic", async () => {
        const wallet = ethers.Wallet.createRandom()
        const randomMnemonic = wallet.mnemonic
        console.log(randomMnemonic)
    }).timeout(30000)

    it("get private key by mnemonic", async () => {
        const numWallet = 20
        const hdNode = ethers.utils.HDNode.fromMnemonic(MNEMONIC)
        // 派生路径：m / purpose' / coin_type' / account' / change / address_index
        // 我们只需要切换最后一位address_index，就可以从hdNode派生出新钱包
        let basePath = "m/44'/60'/0'/0";
        let wallets = [];
        for (let i = 0; i < numWallet; i++) {
            let hdNodeNew = hdNode.derivePath(basePath + "/" + i);
            let walletNew = new ethers.Wallet(hdNodeNew.privateKey);
            console.log(`account${i} ${walletNew.address} privateKey: ${walletNew.privateKey}`)
            wallets.push(walletNew);
        }
    }).timeout(30000)
})


async function getGasPrice(provider) {
    const gasPrice = await provider.getGasPrice()
    return parseInt(gasPrice.toHexString().replaceAll("0x0", "0x"), 16)
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


module.exports = {
    getTxReceipt
};
