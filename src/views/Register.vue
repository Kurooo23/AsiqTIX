<template>
  <div class="register-page">
    <div class="register-container">
      <img src="/logo_with_text.png" alt="Logo" class="logo" />
      <h1>Selamat Datang!</h1>

      <form @submit.prevent="register">
        <div class="form-group">
          <label for="email">Email:</label>
          <input
            type="email"
            id="email"
            v-model="email"
            placeholder="Masukkan email"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password:</label>
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="Masukkan password"
            required
          />
        </div>

        <button type="submit">Daftar</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const email = ref('')
const password = ref('')
function register() {
  alert(`Register dengan email: ${email.value}`)
}
</script>

<style scoped>
.register-page {
  display: flex;
  justify-content: center; /* Tengah horizontal */
  align-items: center; /* Tengah vertikal */
  height: 100vh;
  width: 100vw;
  background-color: #000;
  margin: 0;
  padding: 0;
}

/* Card Register */
.register-container {
  background-color: #f9f9f9;
  padding: 2.5rem 3rem;
  border-radius: 12px;
  box-shadow: 0 0 25px rgba(255, 255, 255, 0.15);
  width: 350px;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

/* Logo */
.logo {
  width: 80px;
  height: auto;
  margin-bottom: 1rem;
}

/* Form */
h1 {
  color: #1f2937;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 0.3rem;
  font-weight: 600;
  color: #333;
}

input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

button {
  width: 100%;
  padding: 0.7rem;
  background-color: #41b883;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background-color: #3aa876;
}
</style>
