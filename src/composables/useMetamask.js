import { ref } from 'vue';
import { ethers } from 'ethers';
import MetaMaskSDK from '@metamask/sdk';

const account = ref(null);
const chainId = ref(null);

let provider = null;   // ethers BrowserProvider
let ethereum = null;   // EIP-1193 provider (injected atau dari SDK)

/** Ambil injected provider dari ekstensi MetaMask (jika ada). */
function getInjectedMetaMask() {
  if (typeof window === 'undefined') return null;
  const eth = window.ethereum;
  if (!eth) return null;

  // Jika ada multi-provider (mis. beberapa wallet), pilih yang MetaMask
  if (Array.isArray(eth.providers)) {
    return eth.providers.find(p => p?.isMetaMask) || null;
  }
  return eth.isMetaMask ? eth : null;
}

/** Lazy init: dipanggil saat butuh provider (mis. ketika user klik Connect). */
function ensureProvider() {
  // 1) Prioritas: injected (ekstensi)
  ethereum = getInjectedMetaMask();

  // 2) Jika tidak ada ekstensi, fallback ke SDK (akan tampil QR untuk pairing Mobile)
  if (!ethereum) {
    const mmsdk = new MetaMaskSDK({
      dappMetadata: { name: 'NFT Ticketing', url: window.location.origin },
      checkInstallationImmediately: false,
    });
    ethereum = mmsdk.getProvider();
  }
  if (!ethereum) throw new Error('MetaMask tidak terdeteksi.');
  return ethereum;
}

export function useMetamask() {
  async function connect() {
    const eth = ensureProvider();

    // Minta izin akun
    const accounts = await eth.request({ method: 'eth_requestAccounts' });

    provider = new ethers.BrowserProvider(eth);
    const signer = await provider.getSigner();
    const net = await provider.getNetwork();

    account.value = accounts[0] || null;
    chainId.value = Number(net.chainId);

    // Listener opsional
    eth.on?.('accountsChanged', (accs) => {
      account.value = accs?.[0] || null;
    });
    eth.on?.('chainChanged', () => window.location.reload());

    return { provider, signer };
  }

  /** Contoh: switch ke Sepolia (bila tetap ingin Ethereum testnet) */
  async function switchToSepolia() {
    const eth = ensureProvider();
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // 11155111
      });
    } catch (e) {
      if (e?.code === 4902) {
        await eth.request({
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

/* ===================== Polygon helpers ===================== */

export async function switchToPolygonAmoy() {
  const eth = ensureProvider();
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x13882' }], // 80002
    });
  } catch (e) {
    if (e?.code === 4902) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x13882',
          chainName: 'Polygon Amoy',
          rpcUrls: ['https://rpc-amoy.polygon.technology'],
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
          blockExplorerUrls: ['https://amoy.polygonscan.com'],
        }],
      });
    } else {
      throw e;
    }
  }
}

export async function switchToPolygonMainnet() {
  const eth = ensureProvider();
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x89' }], // 137
    });
  } catch (e) {
    if (e?.code === 4902) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x89',
          chainName: 'Polygon Mainnet',
          rpcUrls: ['https://polygon-rpc.com'],
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
          blockExplorerUrls: ['https://polygonscan.com'],
        }],
      });
    } else {
      throw e;
    }
  }
}
