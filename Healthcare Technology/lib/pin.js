import { ethers } from 'ethers'
import Web3Modal from 'web3modal'
import WalletConnectProvider from '@walletconnect/web3-provider'

let web3Modal

function initWeb3Modal() {
  if (web3Modal) return web3Modal

  web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          rpc: { [process.env.NEXT_PUBLIC_CHAIN_ID]: process.env.NEXT_PUBLIC_RPC_URL }
        }
      }
    }
  })

  return web3Modal
}

export async function connectWallet() {
  const modal = initWeb3Modal()
  const instance = await modal.connect()
  const provider = new ethers.providers.Web3Provider(instance)
  const signer = provider.getSigner()

  const address = await signer.getAddress()
  const network = await provider.getNetwork()

  return { provider, signer, address, network }
}

export function disconnectWallet() {
  if (web3Modal) web3Modal.clearCachedProvider()
}
