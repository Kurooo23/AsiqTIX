<template>
  <div class="login-page">
    <div class="login-container">
      <img src="/logo_with_text.png" alt="Logo" class="logo" />
      <h1>Selamat Datang!</h1>
      <p v-if="!hasMetaMask" class="hint">Pastikan Anda telah memasang ekstensi MetaMask pada browser Anda atau aplikasi MetaMask pada perangkat seluler Anda.</p>

      <p class="subtitle">Hubungkan wallet MetaMask untuk mendaftar</p>

      <!-- Status Message -->
      <div v-if="statusMessage" :class="['status-message', statusType]">
        {{ statusMessage }}
      </div>

      <!-- Wallet Info (jika sudah terhubung) -->
      <div v-if="walletAddress" class="wallet-info">
        <div class="wallet-label">🦊 Wallet Terhubung</div>
        <div class="wallet-address">{{ shortenAddress(walletAddress) }}</div>
        <div class="wallet-full" :title="walletAddress">{{ walletAddress }}</div>
      </div>

      <!-- Tombol Connect / Daftar -->
      <button
        v-if="!walletAddress"
        @click="connectMetaMask"
        :disabled="isConnecting"
        class="btn-metamask"
      >
        <span v-if="isConnecting">⏳ Menghubungkan...</span>
        <span v-else>🦊 Hubungkan MetaMask</span>
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

      <!-- Info MetaMask (muncul hanya jika koneksi gagal karena tidak terdeteksi) -->
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
import { useMetamask } from '@/composables/useMetamask'
import { getAddress } from 'ethers'

/** --- Router untuk redirect --- */
const router = useRouter()

/** --- state UI --- */
const isConnecting  = ref(false)
const islogining    = ref(false)
const statusMessage = ref('')
const statusType    = ref('') // 'success' | 'error' | 'warning'
const hasMetaMask   = ref(true) // di-set false hanya ketika connect() gagal karena provider tidak ada

/** --- integrasi MetaMask dari composable --- */
const { connect, account } = useMetamask()

/** Sinkronkan account (ref dari composable) ke variabel lokal untuk template */
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

/** Helper: fetch yang memaksa respons JSON (supaya error HTML kebaca jelas) */
async function fetchJSON(url, options) {
  const res  = await fetch(url, options)
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch {
    throw new Error(`Unexpected response (${res.status}): ${text.slice(0, 120)}`)
  }
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`)
  return data
}

/** Hubungkan MetaMask via composable (lazy init provider) */
async function connectMetaMask() {
  isConnecting.value = true
  try {
    await connect() // akan memicu pembaruan 'account' (watch di atas akan jalan)
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

  // Normalisasi ke EIP-55 checksum (wajib untuk SIWE)
  let addr
  try { addr = getAddress(walletAddress.value) }
  catch { showStatus('Alamat wallet tidak valid.', 'error'); return }

  islogining.value = true
  try {
    // 1) chainId dari MetaMask
    const hexChainId = await window.ethereum.request({ method: 'eth_chainId' })
    const chainId = parseInt(hexChainId, 16)

    // 2) ambil nonce (pakai addr checksummed)
    const { nonce } = await fetchJSON(`/api/nonce?address=${addr}`)

    // 3) susun SIWE message (baris ke-2 harus alamat checksum)
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

    // 4) tanda tangan di MetaMask
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, addr],
    })

    // 5) verifikasi ke backend
    const data = await fetchJSON('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, signature }),
    })

    // 6) simpan kredensial untuk melewati router-guard
    localStorage.setItem('walletAddress', addr)
    if (data?.token) localStorage.setItem('auth_token', data.token)

    showStatus('🎉 Autentikasi berhasil!', 'success')
    // Redirect memakai Vue Router (lebih andal)
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
/* === CSS asli Anda tetap === */
.login-page {
  display: flex; justify-content: center; align-items: center;
  height: 100vh; width: 100vw; background-color: #000; margin: 0; padding: 0;
}
.login-container {
  background-color: #f9f9f9; padding: 2.5rem 3rem; border-radius: 12px;
  box-shadow: 0 0 25px rgba(255, 255, 255, 0.15); width: 380px; text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.2);
}
.logo { width: 80px; height: auto; margin-bottom: 1rem; }
h1 { color: #1f2937; margin-bottom: 0.5rem; font-size: 1.8rem; }
.subtitle { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }

.hint {
  margin: 8px 0 14px;
  font-size: 0.85rem;
  color: #8a8a8a;
}

.status-message { padding: 0.8rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; animation: slideDown 0.3s ease; }
.status-message.success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.status-message.error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
.status-message.warning { background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px) } to { opacity: 1; transform: translateY(0) } }

.wallet-info { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 1rem; border-radius: 10px; margin-bottom: 1rem; animation: fadeIn 0.3s ease; }
.wallet-label { font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 600; }
.wallet-address { font-size: 1.2rem; font-family: monospace; font-weight: bold; margin-bottom: 0.3rem; }
.wallet-full { font-size: 0.7rem; font-family: monospace; opacity: 0.8; word-break: break-all; line-height: 1.2; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }

.btn-metamask, .btn-login {
  width: 100%; padding: 0.9rem; border: none; border-radius: 8px; font-size: 1rem;
  font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-bottom: 0.5rem;
}
.btn-metamask { background: linear-gradient(135deg, #f6851b 0%, #e2761b 100%); color: #fff; }
.btn-metamask:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(246, 133, 27, 0.4); }
.btn-login { background: linear-gradient(135deg, #41b883 0%, #35a372 100%); color: #fff; }
.btn-login:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(65, 184, 131, 0.4); }
.btn-metamask:disabled, .btn-login:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }

.footer-links { margin-top: 1.5rem; }
.link { color: #41b883; text-decoration: none; font-size: 0.9rem; transition: color 0.2s; }
.link:hover { color: #35a372; text-decoration: underline; }

.metamask-warning { margin-top: 1.5rem; padding: 1rem; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; color: #856404; }
.metamask-warning p { margin-bottom: 0.5rem; font-weight: 600; }
.install-link { display: inline-block; padding: 0.5rem 1rem; background-color: #f6851b; color: #fff; text-decoration: none; border-radius: 6px; font-size: 0.9rem; transition: background 0.2s; }
.install-link:hover { background-color: #e2761b; }
</style>