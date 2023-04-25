require("@nomicfoundation/hardhat-toolbox");

const ALCHEMY_API_KEY = "RCBd9pi7A5J4YpdugIxnyvzIFliZYZH_";
//0x7752DCD7c6ce4aED048c028021D635CBEc6C001D
const PRIVATE_KEY = "5af7968aa9b98c864e716ec42ea37d75a7904f0a5adc040405c24562a9f186ee";
//default mnemonic: test test test test test test test test test test test junk
const MNEMONIC = "already luggage walk truly world rent unlock quick tube actual acoustic spin";
const INITIALINDEX = 0;
const COUNT = 1000;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "localhost",
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545",
            accounts: {
                mnemonic: MNEMONIC,
                path: "m/44'/60'/0'/0",
                initialIndex: INITIALINDEX,
                count: 20,
                passphrase: ""
            }
        },
        goerli: {
            url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
            accounts: [PRIVATE_KEY]
        },
        sepolia: {
            url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
            accounts: [PRIVATE_KEY]
        },
        gw_alphanet_v1: {
            url: "https://gw-alphanet-v1.godwoken.cf/instant-finality-hack",
            accounts: {
                mnemonic: MNEMONIC,
                initialIndex: INITIALINDEX,
                count: COUNT
            }
        },
        gw_testnet_v1: {
            url: "https://v1.testnet.godwoken.io/rpc/instant-finality-hack",
            accounts: {
                mnemonic: MNEMONIC,
                initialIndex: INITIALINDEX,
                count: COUNT
            }
        },
        axon_devnet: {
            url: "http://34.216.103.183:8000",
            accounts: {
                mnemonic: MNEMONIC,
                initialIndex: INITIALINDEX,
                count: COUNT
            }
        }
    },
    MNEMONIC,
    INITIALINDEX,
    COUNT,
    perf: {
        //每个账户充值金额
        depositAmount: 0.01,
        //账户总数
        accountsNum: 10000,
        //每间隔interval个账户取1个账户，作为第一批账户
        interval: 1000
    }
};
