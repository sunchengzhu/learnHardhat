const {ethers} = require("hardhat");
const {MNEMONIC, INITIALINDEX} = require("../hardhat.config");
const {concurrentRun, getTxReceipt} = require("./prepare");

describe("get msg", function () {
    it("get block msg", async () => {
        const blockNumber = await ethers.provider.getBlockNumber()
        const gasPrice = await getGasPrice(ethers.provider)
        console.log(`latest block number: ${blockNumber}`)
        console.log(`gas price: ${gasPrice} wei`)
    }).timeout(30000)

    it("get accounts msg", async () => {
        const signers = await ethers.getSigners();
        const requestFnList = signers.map((signer) => () => ethers.provider.getBalance(signer.address))
        const reply = await concurrentRun(requestFnList, 20, "查询所有账户余额");
        //和上面那个map作用一样，我怕忘了，把柯里化之前的形式也写一遍
        const requestFnList1 = signers.map(
            function (signer) {
                return function () {
                    ethers.provider.getTransactionCount(signer.address)
                }
            })
        const reply1 = await concurrentRun(requestFnList1, 20, "查询所有账户nonce");
        for (let i = 0; i < signers.length; i++) {
            console.log(`account${i + INITIALINDEX} ${signers[i].address} balance: ${ethers.utils.formatEther(reply[i])} eth,nonce: ${reply1[i]}`);
        }
    }).timeout(180000)

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
        let basePath = "m/44'/60'/0'/0";
        for (let i = 0; i < numWallet; i++) {
            let hdNodeNew = hdNode.derivePath(basePath + "/" + i);
            console.log(`account${i} ${hdNodeNew.address} privateKey: ${hdNodeNew.privateKey}`)
        }
    }).timeout(30000)
})

async function getGasPrice(provider) {
    const gasPrice = await provider.getGasPrice()
    return parseInt(gasPrice.toHexString().replaceAll("0x0", "0x"), 16)
}
