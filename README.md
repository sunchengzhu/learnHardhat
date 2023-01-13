# learnHardhat

简单使用hardhat部署合约、调用合约函数，详细分析见[notion文章](https://cryptape.notion.site/hardhat-rpc-51702610a2f9471cadfe89feb646531d)

## 使用步骤

1. 安装依赖包

```shell
npm install
```

2. 启用rpc日志功能

```shell
npm run addRpcLog
#如需关闭rpc日志功能，则执行以下命令
rm -rf node_modules/hardhat && npm install hardhat
```

3. 编译合约

```shell
npx hardhat compile
```

4. 选择网络  
   通过在hardhat.config.js中设置defaultNetwork选择网络，如果选了本地网络localhost，则需要启动本地节点

```shell
npx hardhat node
#若需要远程调用hardhat node服务，则执行以下命令
npx hardhat node --hostname 0.0.0.0 --port 8545
```

5. 执行用例  
   打开test/demo.js，点击it旁边的绿色符号即可执行用例
