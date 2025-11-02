<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: var(--background-color);
  color: var(--text-primary);
  font-family: var(--font-family);
}
</style>