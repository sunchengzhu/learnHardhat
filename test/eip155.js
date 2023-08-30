const {ethers} = require("hardhat");
const {expect} = require("chai");

describe("eip155", function () {
  it("should match local and on-chain v, r, s values", async function () {
    const [signer] = await ethers.getSigners();
    // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    const wallet = new ethers.Wallet("ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", ethers.provider);
    expect(signer.address).to.be.equal(wallet.address)

    const nonce = await ethers.provider.getTransactionCount(signer.address);
    const gasPrice = await getGasPrice(ethers.provider);
    const chainId = (await ethers.provider.getNetwork()).chainId;
    console.log("chain id", chainId)

    const rawTx = {
      nonce: "0x" + nonce.toString(16),
      gasPrice: gasPrice,
      // 21000
      gasLimit: '0x5208',
      to: signer.address,
      value: '0x1',
      data: '0x',
      chainId: chainId
    };

    const signedTransaction = await wallet.signTransaction(rawTx);
    const parsedTransaction = ethers.utils.parseTransaction(signedTransaction);
    const {v, r, s} = parsedTransaction;

    console.log('Local');
    console.log('v:', v);
    console.log('r:', r);
    console.log('s:', s);

    const txResponse = await signer.sendTransaction(rawTx);
    await txResponse.wait();
    console.log("On-chain");
    console.log("v:", txResponse.v);
    console.log("r:", txResponse.r);
    console.log("s:", txResponse.s);

    expect(v).to.be.equal(txResponse.v);
    expect(r).to.be.equal(txResponse.r);
    expect(s).to.be.equal(txResponse.s);
  }).timeout(60000);
});

async function getGasPrice(provider) {
  const gasPrice = await provider.getGasPrice();
  return parseInt(gasPrice.toHexString().replaceAll("0x0", "0x"), 16);
}
