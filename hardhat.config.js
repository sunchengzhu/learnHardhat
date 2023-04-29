require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config()

//default mnemonic: test test test test test test test test test test test junk
const MNEMONIC = process.env.MNEMONIC;
const INITIALINDEX = parseInt(process.env.INITIALINDEX);
const COUNT = parseInt(process.env.COUNT);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "gw_testnet_v1",
    networks: {
        gw_testnet_v1: {
            url: "https://v1.testnet.godwoken.io/rpc/instant-finality-hack",
            accounts: {
                mnemonic: MNEMONIC,
                initialIndex: INITIALINDEX,
                count: COUNT
            }
        },
        gw_alphanet_v1: {
            url: "https://gw-alphanet-v1.godwoken.cf/instant-finality-hack",
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
    COUNT
};
