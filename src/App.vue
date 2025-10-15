<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
#app { max-width: none !important; margin: 0 !important; padding: 0 !important; }
/* Hilangkan scroll atau ruang putih di kanan */
body {
  background-color: #0b0d12;
  color: #e6e8ef;
  overflow: auto;
}
</style>
