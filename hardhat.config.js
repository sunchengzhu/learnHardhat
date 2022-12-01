require("@nomicfoundation/hardhat-toolbox");

const ALCHEMY_API_KEY = "RCBd9pi7A5J4YpdugIxnyvzIFliZYZH_";
//0x7752DCD7c6ce4aED048c028021D635CBEc6C001D
const GOERLI_PRIVATE_KEY = "5af7968aa9b98c864e716ec42ea37d75a7904f0a5adc040405c24562a9f186ee";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "goerli",
    networks: {
        hardhat: {
            loggingEnabled: true
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            accounts: {
                mnemonic: "test test test test test test test test test test test junk",
                path: "m/44'/60'/0'/0",
                initialIndex: 0,
                count: 20,
                passphrase: "",
            },
        },
        goerli: {
            url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
            accounts: [GOERLI_PRIVATE_KEY]
        }
    },
    solidity: "0.8.17"
};