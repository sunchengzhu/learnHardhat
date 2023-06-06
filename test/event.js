const {ethers} = require("hardhat");

describe("event", function () {
    it("deploy and invoke", async () => {
        const TestEvent = await ethers.getContractFactory("TestEvent");
        const contract = await TestEvent.deploy();
        await contract.deployed();
        console.log("contract address:", contract.address);
        const tx = await contract.testEvent();
        const receipt = await tx.wait();
        // console.log(receipt);
        console.log(receipt.logs);
    }).timeout(60000)
})
