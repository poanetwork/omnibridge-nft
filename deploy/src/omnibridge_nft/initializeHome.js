const { web3Home, deploymentAddress } = require('../web3')
const { EternalStorageProxy, HomeNFTOmnibridge } = require('../loadContracts')
const { sendRawTxHome, transferProxyOwnership } = require('../deploymentUtils')

const { HOME_AMB_BRIDGE, HOME_BRIDGE_OWNER, HOME_UPGRADEABLE_ADMIN } = require('../loadEnv')

function initializeMediator({
  contract,
  params: { bridgeContract, mediatorContract, owner, tokenImage, gasLimitManager, forwardingRulesManager },
}) {
  console.log(`
    AMB contract: ${bridgeContract},
    Mediator contract: ${mediatorContract},
    OWNER: ${owner},
    TOKEN_IMAGE: ${tokenImage},
    GAS_LIMIT_MANAGER: ${gasLimitManager},
    FORWARDING_RULES_MANAGER: ${forwardingRulesManager}
    `)

  return contract.methods
    .initialize(bridgeContract, mediatorContract, gasLimitManager, owner, tokenImage, forwardingRulesManager)
    .encodeABI()
}

async function initialize({ homeBridge, foreignBridge, tokenImage, forwardingRulesManager, gasLimitManager }) {
  let nonce = await web3Home.eth.getTransactionCount(deploymentAddress)
  const mediatorContract = new web3Home.eth.Contract(HomeNFTOmnibridge.abi, homeBridge)

  console.log('\n[Home] Initializing Bridge Mediator with following parameters:')

  const initializeMediatorData = initializeMediator({
    contract: mediatorContract,
    params: {
      bridgeContract: HOME_AMB_BRIDGE,
      mediatorContract: foreignBridge,
      gasLimitManager,
      owner: HOME_BRIDGE_OWNER,
      tokenImage,
      forwardingRulesManager,
    },
  })

  await sendRawTxHome({
    data: initializeMediatorData,
    nonce: nonce++,
    to: homeBridge,
  })

  console.log('\n[Home] Transferring bridge mediator proxy ownership to upgradeability admin')
  const mediatorProxy = new web3Home.eth.Contract(EternalStorageProxy.abi, homeBridge)
  await transferProxyOwnership({
    proxy: mediatorProxy,
    newOwner: HOME_UPGRADEABLE_ADMIN,
    nonce: nonce++,
  })
}

module.exports = initialize
