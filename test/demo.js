const {ethers} = require("hardhat");
const {expect} = require("chai");

describe("deploy", function () {
    it("deploy contract", async () => {
        const Learn = await ethers.getContractFactory("Learn");
        const contract = await Learn.deploy();
        await contract.deployed();
        console.log("contract address:", contract.address);
    }).timeout(30000)
})

describe("invoke", function () {
    let learn, learnAddress;
    before(async function () {
        this.timeout(30000);
        const Learn = await ethers.getContractFactory("Learn");
        const chainId = (await ethers.provider.getNetwork()).chainId;
        if (chainId == 5) {
            learnAddress = "0xB03E3F89dde1bCb25991A12DAb94389e128606D5";
        } else {
            const contract = await Learn.deploy();
            await contract.deployed();
            learnAddress = contract.address;
        }
        learn = await Learn.attach(learnAddress);
    });
    it("invoke pure function", async () => {
        const result = await learn.add(1, 2);
        console.log("result:", result);
    }).timeout(30000)
    it("get add function call data", async () => {
        const data = await learn.getCallData(1, 2);
        console.log("result:", data);
    }).timeout(30000)
    it("invoke function", async () => {
        const randomNum = Math.floor(Math.random() * 1000000);
        const tx = await learn.setValue(randomNum);
        const receipt = await tx.wait();
        const value = await learn.getValue();
        expect(value).to.be.equal(randomNum)
        console.log("receipt:", receipt);
        console.log("value:", value);
    }).timeout(30000)
    it("invoke function call static", async () => {
        const randomNum = Math.floor(Math.random() * 1000000);
        const result = await learn.callStatic.setValue(randomNum);
        const value = await learn.getValue();
        expect(value).to.be.not.equal(randomNum)
        console.log("result:", result);
        console.log("value:", value);
    }).timeout(30000)
})