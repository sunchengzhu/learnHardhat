const {ethers} = require("hardhat");

describe("transfer", function () {
    it("transfer demo", async () => {
        const signers = await ethers.getSigners();
        const from = signers[0].address;
        const to = "0x9DD3c285F8c253fB6327549E46f82E3DEdf59E34";
        const ethValue = "1";
        const value = ethers.utils.parseUnits(ethValue, "ether").toHexString().replaceAll("0x0", "0x");
        await transfer(from, to, value);
    }).timeout(60000)
})

async function transfer(from, to, value) {
    const from_balance = ethers.utils.formatEther(await ethers.provider.getBalance(from));
    const to_balance = ethers.utils.formatEther(await ethers.provider.getBalance(to));
    console.log(`before transfer ${from} balance:${from_balance} eth ${to} balance:${to_balance} eth`);
    const getPrice = await ethers.provider.getGasPrice();
    const gasPrice = getPrice.toHexString().replaceAll("0x0", "0x");
    const gas = await ethers.provider.send("eth_estimateGas", [{
        from,
        to
    }])
    const tx = await ethers.provider.send("eth_sendTransaction", [{
        from,
        to,
        "gas": gas,
        "gasPrice": gasPrice,
        "value": value,
        "data": "0x"
    }])
    await getTxReceipt(ethers.provider, tx, 100);
    const from_balance_sent = ethers.utils.formatEther(await ethers.provider.getBalance(from));
    const to_balance_sent = ethers.utils.formatEther(await ethers.provider.getBalance(to));
    console.log(`after transfer ${from} balance:${from_balance_sent} eth ${to} balance:${to_balance_sent} eth`);
}

async function getTxReceipt(provider, txHash, count) {
    let response
    for (let i = 0; i < count; i++) {
        response = await provider.getTransactionReceipt(txHash);
        if (response == null) {
            await sleep(2000)
            continue;
        }
        if (response.confirmations >= 1) {
            return response;
        }
        await sleep(2000)
    }
    return response;
}

async function sleep(timeOut) {
    await new Promise(r => setTimeout(r, timeOut));
}