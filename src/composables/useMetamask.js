import MetaMaskSDK from '@metamask/sdk';
import { ethers } from 'ethers';
import { ref } from 'vue';

const account = ref(null);
const chainId = ref(null);
let provider = null;

const mmsdk = new MetaMaskSDK({
  dappMetadata: { name: 'NFT Ticketing', url: window.location.origin },
  checkInstallationImmediately: false,
});
const ethereum = mmsdk.getProvider(); // EIP-1193 provider

export function useMetamask() {
  async function connect() {
    if (!ethereum) throw new Error('MetaMask tidak terdeteksi.');
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const net = await provider.getNetwork();
    account.value = accounts[0];
    chainId.value = Number(net.chainId);
    return { provider, signer };
  }

  async function switchToSepolia() {
    if (!ethereum) return;
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia
      });
    } catch (e) {
      if (e?.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia',
            rpcUrls: ['https://sepolia.infura.io/v3/<YOUR_INFURA_KEY>'],
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
      } else {
        throw e;
      }
    }
  }

  return { connect, switchToSepolia, account, chainId };
}
