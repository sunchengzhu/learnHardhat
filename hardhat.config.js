require("@nomicfoundation/hardhat-toolbox");

//default mnemonic: test test test test test test test test test test test junk
const MNEMONIC = "already luggage walk truly world rent unlock quick tube actual acoustic spin";
const INITIALINDEX = 0;
const COUNT = 1000;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "localhost",
    networks: {
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
