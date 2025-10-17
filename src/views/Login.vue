<template>
  <div class="login-page">
    <div class="login-container">
      <img src="/logo_with_text.png" alt="Logo" class="logo" />
      <h1>Selamat Datang!</h1>

      <p v-if="!hasMetaMask" class="hint">
        Pastikan Anda telah memasang ekstensi MetaMask pada browser Anda atau aplikasi MetaMask pada perangkat seluler Anda.
      </p>

      <p class="subtitle">Hubungkan wallet MetaMask untuk mendaftar</p>

      <!-- Status Message -->
      <div v-if="statusMessage" :class="['status-message', statusType]">
        {{ statusMessage }}
      </div>

      <!-- Wallet Info -->
      <div v-if="walletAddress" class="wallet-info">
        <div class="wallet-label">
          <img :src="metaMaskIcon" class="mm-ico" alt="MetaMask" />
          <span>Wallet Terhubung</span>
        </div>
        <div class="wallet-address">{{ shortenAddress(walletAddress) }}</div>
      </div>

      <!-- Tombol Connect / Masuk -->
      <button
        v-if="!walletAddress"
        @click="connectMetaMask"
        :disabled="isConnecting"
        class="btn-metamask"
      >
        <template v-if="isConnecting">
          ⏳ Menghubungkan...
        </template>
        <template v-else>
          <img :src="metaMaskIcon" class="mm-ico mm-ico--btn" alt="MetaMask" />
          <span class="btn-label">Hubungkan MetaMask</span>
        </template>
      </button>

      <button
        v-else
        @click="loginAccount"
        :disabled="islogining"
        class="btn-login"
      >
        <span v-if="islogining">⏳ Mendaftarkan...</span>
        <span v-else>Masuk</span>
      </button>

      <div v-if="!hasMetaMask" class="metamask-warning">
        <p>⚠️ MetaMask tidak terdeteksi!</p>
        <a href="https://metamask.io/download/" target="_blank" class="install-link">
          Install MetaMask
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getAddress } from 'ethers'
import { useMetamask } from '@/composables/useMetamask'
import metaMaskIcon from '@/assets/MetaMask.png'   // ⟵ gunakan PNG

/** Router */
const router = useRouter()

/** State UI */
const isConnecting  = ref(false)
const islogining    = ref(false)
const statusMessage = ref('')
const statusType    = ref('') // 'success' | 'error' | 'warning'
const hasMetaMask   = ref(true)

/** Integrasi MetaMask */
const { connect, account } = useMetamask()

/** Sinkronkan account ke variabel lokal untuk template */
const walletAddress = ref('')
watch(account, (val) => { walletAddress.value = val || '' })

/** Util UI */
function showStatus(message, type) {
  statusMessage.value = message
  statusType.value = type
  setTimeout(() => { statusMessage.value = ''; statusType.value = '' }, 5000)
}

function shortenAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/** Helper fetch JSON via Vite proxy */
async function fetchJSON(path, options) {
  if (typeof path !== 'string' || !path.startsWith('/api')) {
    throw new Error(`Path harus diawali '/api'. Diterima: ${String(path)}`)
  }
  const timeoutMs = 15000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let res, text
  try {
    res = await fetch(path, {
      method: (options && options.method) || 'GET',
      headers: (options && options.headers) || {},
      body: (options && options.body) || undefined,
      credentials: 'omit',
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    throw new Error(
      `Tidak dapat terhubung ke backend: ${err?.name === 'AbortError'
        ? `Timeout ${timeoutMs}ms`
        : (err?.message || err)}`
    )
  }

  try { text = await res.text() } finally { clearTimeout(timer) }

  let data = {}
  if (text && text.trim()) {
    try { data = JSON.parse(text) } catch { data = { message: text } }
  }
  if (!res.ok) {
    const snippet = (data?.message || text || '').toString().slice(0, 200)
    const where = res.url || '(via Vite proxy)'
    const statusLine = `${res.status} ${res.statusText || ''}`.trim()
    throw new Error(`Request gagal (${statusLine}) ke ${where}: ${snippet}`)
  }
  return data
}

/** Hubungkan MetaMask */
async function connectMetaMask() {
  isConnecting.value = true
  try {
    if (!window.ethereum) {
      hasMetaMask.value = false
      showStatus('MetaMask tidak terdeteksi. Silakan install terlebih dahulu.', 'warning')
      return
    }
    await connect()
    if (walletAddress.value) showStatus('Wallet berhasil terhubung!', 'success')
  } catch (error) {
    console.error('Error connecting MetaMask:', error)
    if (String(error?.message || '').toLowerCase().includes('tidak terdeteksi')) {
      hasMetaMask.value = false
      showStatus('MetaMask tidak terdeteksi. Silakan install terlebih dahulu.', 'warning')
    } else if (error?.code === 4001) {
      showStatus('Koneksi dibatalkan oleh pengguna.', 'error')
    } else {
      showStatus('Gagal menghubungkan wallet: ' + (error?.message || error), 'error')
    }
  } finally {
    isConnecting.value = false
  }
}

/** Registrasi / Login via SIWE */
async function loginAccount() {
  if (!walletAddress.value) {
    showStatus('Silakan hubungkan wallet terlebih dahulu!', 'error')
    return
  }
  let addr
  try { addr = getAddress(walletAddress.value) }
  catch { showStatus('Alamat wallet tidak valid.', 'error'); return }

  islogining.value = true
  try {
    if (!window.ethereum) {
      showStatus('MetaMask tidak terdeteksi pada browser ini.', 'error')
      return
    }
    const hexChainId = await window.ethereum.request({ method: 'eth_chainId' })
    const chainId = parseInt(hexChainId, 16)

    const { nonce } = await fetchJSON(`/api/nonce?address=${addr}`)

    const domain   = window.location.host
    const origin   = window.location.origin
    const issuedAt = new Date().toISOString()
    const statement = 'Sign in to AsiQTIX'
    const message =
`${domain} wants you to sign in with your Ethereum account:
${addr}

${statement}

URI: ${origin}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`

    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, addr],
    })

    const data = await fetchJSON('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, signature }),
    })

    localStorage.setItem('walletAddress', addr)
    if (data?.token) localStorage.setItem('auth_token', data.token)

    showStatus('🎉 Autentikasi berhasil!', 'success')
    router.push({ name: 'home' })
  } catch (e) {
    console.error(e)
    showStatus(String(e?.message || e), 'error')
  } finally {
    islogining.value = false
  }
}
</script>

<style scoped>
/* ====== Layout panel login ====== */
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh; width: 100vw;
  background-color: #000;
  margin: 0; padding: 0;
}
.login-container {
  background-color: #f9f9f9;
  padding: 2.5rem 3rem;
  border-radius: 12px;
  box-shadow: 0 0 25px rgba(255, 255, 255, 0.15);
  width: 380px;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.2);
}
.logo { width: 80px; height: auto; margin-bottom: 1rem; }
h1 { color: #1f2937; margin-bottom: 0.5rem; font-size: 1.8rem; }
.subtitle { color: #666; font-size: 0.9rem; margin-bottom: 1.25rem; }
.hint { margin: 8px 0 14px; font-size: 0.85rem; color: #8a8a8a; }

/* ====== Status message ====== */
.status-message {
  padding: 0.8rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem;
  animation: slideDown 0.3s ease;
}
.status-message.success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.status-message.error   { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
.status-message.warning { background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px) } to { opacity: 1; transform: translateY(0) } }

/* ====== Info wallet ====== */
.wallet-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff; padding: 1rem; border-radius: 10px; margin-bottom: 1rem;
  animation: fadeIn 0.3s ease;
}
.wallet-label{display: inline-flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 600;}
.wallet-address { font-size: 1.2rem; font-family: monospace; font-weight: bold; margin-bottom: 0.3rem; }
.wallet-full    { font-size: 0.7rem; font-family: monospace; opacity: 0.8; word-break: break-all; line-height: 1.2; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }

/* ====== Buttons ====== */
.btn-metamask,
.btn-login {
  width: 100%;
  padding: 0.9rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0.6rem;
}

/* Tombol MetaMask */
.btn-metamask {
  background: linear-gradient(135deg, #f6851b 0%, #e2761b 100%);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  line-height: 1;
}
.btn-metamask:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(246, 133, 27, 0.4);
}
.btn-metamask:disabled { opacity: .65; cursor: not-allowed; }

.btn-label { font-weight: 700; letter-spacing: .2px; }

/* Tombol login */
.btn-login {
  background: linear-gradient(135deg, #41b883 0%, #35a372 100%);
  color: #fff;
}
.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(65, 184, 131, 0.4);
}
.btn-login:disabled { opacity: .65; cursor: not-allowed; }

/* ====== MetaMask warning ====== */
.metamask-warning { margin-top: 1.5rem; padding: 1rem; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; color: #856404; }
.metamask-warning p { margin-bottom: 0.5rem; font-weight: 600; }
.install-link { display: inline-block; padding: 0.5rem 1rem; background-color: #f6851b; color: #fff; text-decoration: none; border-radius: 6px; font-size: 0.9rem; transition: background 0.2s; }
.install-link:hover { background-color: #e2761b; }

/* ====== Ikon MetaMask (PNG) ====== */
.mm-ico{ width: 18px; height: 18px; object-fit: contain; display:inline-block; }
.mm-ico--btn{ width: 22px; height: 22px; }
</style>
