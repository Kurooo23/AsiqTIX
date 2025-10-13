<template>
  <div class="login-page">
    <div class="login-container">
      <img src="/logo_with_text.png" alt="Logo" class="logo" />
      <h1>Selamat Datang!</h1>
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
        <span v-else>✅ Daftar Sekarang</span>
      </button>

      <!-- Link untuk pengguna yang sudah punya akun -->
      <div class="footer-links">
        <a href="/login" class="link">Sudah punya akun? Login</a>
      </div>

      <!-- Info MetaMask -->
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
import { ref, onMounted, watch } from 'vue'
import { useMetamask } from '@/composables/useMetamask' // ganti ke './composables/useMetamask' jika belum pakai alias '@'

/** --- state umum UI --- */
const isConnecting   = ref(false)
const islogining     = ref(false)
const statusMessage  = ref('')
const statusType     = ref('') // 'success' | 'error' | 'warning'
const hasMetaMask    = ref(true)

/** --- integrasi MetaMask dari composable --- */
const { connect, account } = useMetamask()

/** Sinkronkan account (ref dari composable) ke variabel lokal agar kompatibel dengan template lama */
const walletAddress = ref('')

watch(account, (val) => {
  walletAddress.value = val || ''
})

/** Deteksi MetaMask & sesi akun yang sudah terhubung */
onMounted(async () => {
  if (typeof window.ethereum === 'undefined') {
    hasMetaMask.value = false
    showStatus('MetaMask tidak terdeteksi. Silakan install terlebih dahulu.', 'warning')
    return
  }

  try {
    // cek akun yang sudah terhubung (jika pengguna pernah mengizinkan)
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    if (accounts?.length) {
      walletAddress.value = accounts[0]
      showStatus('Wallet sudah terhubung.', 'success')
    }

    // dengarkan perubahan akun & chain
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', () => window.location.reload())
  } catch (err) {
    console.error('Error saat cek koneksi awal:', err)
  }
})

/** Hubungkan MetaMask via composable */
async function connectMetaMask() {
  if (!hasMetaMask.value) {
    showStatus('Silakan install MetaMask terlebih dahulu!', 'error')
    return
  }
  isConnecting.value = true
  try {
    await connect() // akan memicu update pada 'account' lalu tersinkron ke walletAddress via watch()
    if (walletAddress.value) showStatus('Wallet berhasil terhubung!', 'success')
  } catch (error) {
    console.error('Error connecting MetaMask:', error)
    if (error?.code === 4001) {
      showStatus('Koneksi dibatalkan oleh pengguna.', 'error')
    } else {
      showStatus('Gagal menghubungkan wallet: ' + (error?.message || error), 'error')
    }
  } finally {
    isConnecting.value = false
  }
}

/** Registrasi / Login ke backend */
async function loginAccount() {
  if (!walletAddress.value) {
    showStatus('Silakan hubungkan wallet terlebih dahulu!', 'error')
    return
  }

  islogining.value = true
  try {
    // Contoh: bila ingin menambahkan signature EIP-191 (opsional)
    // const signature = await signMessage()

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: walletAddress.value,
        // signature,
        timestamp: Date.now(),
      }),
    })

    const data = await response.json()
    if (response.ok) {
      showStatus('🎉 Registrasi berhasil!', 'success')
      setTimeout(() => { window.location.href = '/dashboard' }, 2000)
    } else {
      if (data?.message === 'Wallet already logined') {
        showStatus('Wallet ini sudah terdaftar. Silakan login.', 'warning')
        setTimeout(() => { window.location.href = '/login' }, 2000)
      } else {
        showStatus(data?.message || 'Gagal melakukan registrasi.', 'error')
      }
    }
  } catch (error) {
    console.error('Error logining:', error)
    showStatus('Terjadi kesalahan saat registrasi: ' + (error?.message || error), 'error')
  } finally {
    islogining.value = false
  }
}

/** (Opsional) Pesan yang ditandatangani untuk verifikasi server-side */
async function signMessage() {
  const message = `Daftar akun baru\nWallet: ${walletAddress.value}\nTimestamp: ${Date.now()}`
  const signature = await window.ethereum.request({
    method: 'personal_sign',
    params: [message, walletAddress.value],
  })
  return signature
}

/** Handler perubahan akun */
function handleAccountsChanged(accounts) {
  if (!accounts?.length) {
    walletAddress.value = ''
    showStatus('Wallet terputus. Silakan hubungkan kembali.', 'warning')
  } else if (accounts[0] !== walletAddress.value) {
    walletAddress.value = accounts[0]
    showStatus('Akun wallet berubah.', 'warning')
  }
}

/** Util UI */
function showStatus(message, type) {
  statusMessage.value = message
  statusType.value = type
  setTimeout(() => {
    statusMessage.value = ''
    statusType.value = ''
  }, 5000)
}

function shortenAddress(address) {
  if (!address) return ''
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}
</script>

<style scoped>
/* === seluruh CSS Anda dipertahankan apa adanya === */
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: #000;
  margin: 0;
  padding: 0;
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
.subtitle { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }

.status-message { padding: 0.8rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; animation: slideDown 0.3s ease; }
.status-message.success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.status-message.error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
.status-message.warning { background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }

@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

.wallet-info { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem; border-radius: 10px; margin-bottom: 1rem; animation: fadeIn 0.3s ease; }
.wallet-label { font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 600; }
.wallet-address { font-size: 1.2rem; font-family: monospace; font-weight: bold; margin-bottom: 0.3rem; }
.wallet-full { font-size: 0.7rem; font-family: monospace; opacity: 0.8; word-break: break-all; line-height: 1.2; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

.btn-metamask, .btn-login { width: 100%; padding: 0.9rem; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-bottom: 0.5rem; }
.btn-metamask { background: linear-gradient(135deg, #f6851b 0%, #e2761b 100%); color: white; }
.btn-metamask:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(246, 133, 27, 0.4); }
.btn-login { background: linear-gradient(135deg, #41b883 0%, #35a372 100%); color: white; }
.btn-login:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(65, 184, 131, 0.4); }
.btn-metamask:disabled, .btn-login:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }

.footer-links { margin-top: 1.5rem; }
.link { color: #41b883; text-decoration: none; font-size: 0.9rem; transition: color 0.2s; }
.link:hover { color: #35a372; text-decoration: underline; }

.metamask-warning { margin-top: 1.5rem; padding: 1rem; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; color: #856404; }
.metamask-warning p { margin-bottom: 0.5rem; font-weight: 600; }
.install-link { display: inline-block; padding: 0.5rem 1rem; background-color: #f6851b; color: white; text-decoration: none; border-radius: 6px; font-size: 0.9rem; transition: background 0.2s; }
.install-link:hover { background-color: #e2761b; }
</style>
