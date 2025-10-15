<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

const router = useRouter()

// --- DATA DEMO (ganti dengan fetch dari backend) ---
const user = ref({
  name: 'Your Name',
  address: '0x0234...78910',
  avatarUrl: '', // opsional: '/assets/profile.png'
})

const purchases = ref([
  { id: 1, concert: 'Hindia in Balikpapan', date: '05/06/2025', price: '100 MATIC', status: 'Successful' },
  { id: 2, concert: 'MLTR',                  date: '03/06/2025', price: '110 MATIC', status: 'Successful' },
  { id: 3, concert: 'KLA Project',           date: '24/05/2025', price: '65 MATIC',  status: 'Successful' },
])

const wallet = ref({
  balance: 8,
  symbol: 'MATIC',
  accountNo: '012345678910',
})

function openDetail(row) {
  // arahkan ke halaman detail transaksi Anda
  // router.push({ name: 'tx-detail', params: { id: row.id } })
  alert(`Detail transaksi: ${row.concert} (${row.date})`)
}

function topUp() {
  // arahkan ke halaman/top up flow
  alert('Top up wallet…')
}

function logout() {
  // hapus sesi lalu ke login
  // localStorage.removeItem('auth_token')
  router.push('/login')
}
</script>

<template>
  <div class="page">
    <!-- Sidebar mini -->
    <aside class="mini-sidebar">
      <div class="ticket-badge">
        <span>🎟️</span>
      </div>
      <nav class="mini-nav">
        <RouterLink to="/home">Home</RouterLink>
        <RouterLink to="/profile" class="active">account</RouterLink>
        <RouterLink to="/wallet">wallet</RouterLink>
        <RouterLink to="/history">history</RouterLink>
        <button class="link-btn" @click="logout">log out</button>
      </nav>
    </aside>

    <main class="content">
      <header class="header">
        <img class="brand-ticket" src="/logo_with_text.png" alt="logo" />
        <h1>Account</h1>
      </header>

      <section class="grid">
        <!-- Avatar / Profile card -->
        <div class="profile-card">
          <div class="avatar" :style="user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : {}">
            <span v-if="!user.avatarUrl">👤</span>
          </div>
          <div class="profile-meta">
            <h3>{{ user.name }}</h3>
            <p class="addr" :title="user.address">{{ user.address }}</p>
          </div>
        </div>

        <!-- Purchase History -->
        <div class="history-card">
          <h2>Purchase History</h2>

          <div class="table">
            <div class="thead">
              <div>Concert(s)</div>
              <div>Payment Date</div>
              <div>Price</div>
              <div>Status</div>
              <div></div>
            </div>

            <div
              v-for="row in purchases"
              :key="row.id"
              class="trow"
            >
              <div class="c1">{{ row.concert }}</div>
              <div class="c2">{{ row.date }}</div>
              <div class="c3">{{ row.price }}</div>
              <div class="c4">{{ row.status }}</div>
              <div class="c5">
                <button class="detail-btn" @click="openDetail(row)">DETAIL</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Wallet Card -->
        <div class="wallet-card">
          <h3>My Wallet</h3>
          <div class="amount">
            {{ wallet.balance }} {{ wallet.symbol }}
          </div>
          <p class="acc">account number: {{ wallet.accountNo }}</p>

          <button class="topup" @click="topUp">TOP UP</button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ====== THEME ====== */
:root{
  --bg: #fbf7e3;               /* krem muda */
  --ink: #15213b;              /* judul */
  --muted: #445172;
  --card: #1f2947;             /* navy card */
  --card-ink: #f6c66a;         /* gold heading */
  --line: #f0b35a;             /* garis emas tipis */
  --maroon: #6b0a06;           /* wallet card */
  --maroon-ink: #ffe9cf;
  --accent: #f0b35a;
}

/* ====== LAYOUT ====== */
.page{
  min-height: 100vh;
  background: var(--bg);
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 20px;
  padding: 20px;
}

.content{
  padding: 8px 6px 30px 6px;
}

.header{
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}
.header h1{
  margin: 0;
  color: var(--ink);
  font-weight: 800;
  letter-spacing: .5px;
}
.brand-ticket{
  height: 36px;
  width: auto;
  object-fit: contain;
}

/* ====== MINI SIDEBAR ====== */
.mini-sidebar{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.ticket-badge{
  width: 80px;
  height: 80px;
  border-radius: 10px;
  background: #f3a52d;
  display: grid;
  place-items: center;
  box-shadow: 0 4px 0 #e08f10 inset;
}
.mini-nav{
  width: 82px;
  background: #f9c35a;
  border-radius: 8px;
  padding: 10px 8px;
  display: grid;
  gap: 6px;
}
.mini-nav a,
.mini-nav .link-btn{
  display: block;
  text-decoration: none;
  color: #6b2a00;
  font-size: 12px;
  text-align: center;
  border-radius: 6px;
  padding: 6px 0;
  background: rgba(255,255,255,.35);
  border: 1px solid rgba(255,255,255,.5);
  cursor: pointer;
}
.mini-nav a.active{ background: #fff; font-weight: 700 }
.mini-nav .link-btn{ background: rgba(255,255,255,.6) }

/* ====== GRID AREA ====== */
.grid{
  display: grid;
  grid-template-columns: 320px 1fr;
  grid-auto-rows: min-content;
  gap: 20px 24px;
}

/* ====== PROFILE CARD ====== */
.profile-card{
  background: #fff2cc;
  border: 2px solid #f3a52d;
  border-radius: 16px;
  padding: 18px;
  display: grid;
  gap: 12px;
  align-content: start;
}
.avatar{
  height: 180px;
  border-radius: 16px;
  background: #6b0a06;
  display: grid;
  place-items: center;
  color: #f8b345;
  font-size: 48px;
  background-size: cover;
  background-position: center;
}
.profile-meta h3{
  margin: 6px 0 2px;
  color: #5b2a00;
  font-weight: 800;
}
.addr{
  margin: 0;
  color: #7b4e1a;
  font-size: 12px;
}

/* ====== HISTORY CARD ====== */
.history-card{
  background: var(--card);
  color: #eaf0ff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 10px 24px rgba(0,0,0,.18);
  border: 1px solid #0d1330;
}
.history-card h2{
  color: var(--card-ink);
  margin: 0 0 12px;
  font-weight: 800;
  letter-spacing: .2px;
}

.table{
  width: 100%;
  display: grid;
  gap: 10px;
}

/* header */
.thead{
  display: grid;
  grid-template-columns: 1.7fr 1fr .7fr .9fr .5fr;
  gap: 10px;
  align-items: center;
  color: var(--card-ink);
  border-bottom: 2px solid var(--line);
  padding: 8px 6px;
  font-weight: 700;
  letter-spacing: .2px;
}

/* rows */
.trow{
  display: grid;
  grid-template-columns: 1.7fr 1fr .7fr .9fr .5fr;
  gap: 10px;
  align-items: center;
  padding: 10px 6px;
  border-bottom: 1px solid rgba(255,255,255,.12);
  color: #dbe4ff;
  font-size: 14px;
}
.trow:last-child{ border-bottom: 2px solid var(--line) }

.detail-btn{
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: #f6d08a;
  color: #1c233d;
  font-weight: 700;
  cursor: pointer;
}

/* ====== WALLET CARD ====== */
.wallet-card{
  grid-column: 1 / span 2;
  background: var(--maroon);
  border-radius: 12px;
  padding: 18px 22px 24px;
  color: var(--maroon-ink);
  position: relative;
}
.wallet-card h3{
  margin: 0 0 10px;
  font-weight: 800;
}
.amount{
  font-size: clamp(28px, 6vw, 54px);
  font-weight: 800;
  letter-spacing: 1px;
  margin: 4px 0 12px;
}
.acc{
  margin: 0;
  opacity: .9;
}
.topup{
  position: absolute;
  right: 16px;
  bottom: 16px;
  font-weight: 800;
  border: 1px solid #ffd7ae;
  background: #ffd7ae;
  color: #3b0d05;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}

/* ====== RESPONSIVE ====== */
@media (max-width: 980px){
  .grid{ grid-template-columns: 1fr }
  .wallet-card{ grid-column: 1 }
}
</style>
