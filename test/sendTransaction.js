const {ethers} = require("hardhat");
const {getTxReceipt} = require("./transfer");

describe("sendTransaction", function () {
    it("sendTransaction demo", async () => {
        const to = "0xebaf2ed9b9a7b1376d3a3b35c43025cb81c47bdb";
        const data = "0x552410770000000000000000000000000000000000000000000000000000000000000379";
        const signers = await ethers.getSigners();
        const from = signers[0].address;
        const ethValue = "0";
        const value = ethers.utils.parseUnits(ethValue, "ether").toHexString().replaceAll("0x0", "0x");
        await sendTransaction(from, to, value, data);
    }).timeout(60000)
})

async function sendTransaction(from, to, value, data) {
    const getPrice = await ethers.provider.getGasPrice();
    const gasPrice = getPrice.toHexString().replaceAll("0x0", "0x");
    const gas = await ethers.provider.send("eth_estimateGas", [{
        from,
        to,
        data
    }])
    const tx = await ethers.provider.send("eth_sendTransaction", [{
        from,
        to,
        "gas": gas,
        "gasPrice": gasPrice,
        "value": value,
        "data": data
    }])
    await getTxReceipt(ethers.provider, tx, 100);
}
