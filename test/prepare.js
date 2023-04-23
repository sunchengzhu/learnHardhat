const {ethers} = require("hardhat")
const BigNumber = require('bignumber.js');
const {COUNT} = require("../hardhat.config");
const {expect} = require("chai");
const ethValue = "0.01";
const value = ethers.utils.parseUnits(ethValue, "ether").toHexString().replaceAll("0x0", "0x");


describe("prepare", function () {
    it("deposit", async () => {
        const gasPrice = await getSufficientGasPrice(ethers.provider);
        const signers = await ethers.getSigners();
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

async function getSufficientGasPrice(provider) {
    const gasPrice = await provider.getGasPrice()
    console.log(`gas price: ${gasPrice} wei`)
    const myGasPrice = new BigNumber(gasPrice.toNumber()).multipliedBy(1.2).decimalPlaces(0)
    console.log(`my gas price: ${myGasPrice} wei`)
    const hexPrice = ethers.BigNumber.from(myGasPrice.toNumber()).toHexString().replaceAll("0x0", "0x")
    return hexPrice
}
