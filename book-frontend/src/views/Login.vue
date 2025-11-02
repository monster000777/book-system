<template>
  <div class="login-page">
    <div class="login-card card">
      <h1 class="title title-h1">欢迎回来</h1>
      <p class="subtitle">请登录您的账户</p>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username" class="form-label">用户名</label>
          <input
            id="username"
            v-model="loginForm.username"
            type="text"
            class="form-input"
            required
            placeholder="请输入用户名"
          />
        </div>
        
        <div class="form-group">
          <label for="password" class="form-label">密码</label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            class="form-input"
            required
            placeholder="请输入密码"
          />
        </div>
        
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="login-footer">
        <p>
          没有账户？
          <router-link to="/register" class="link">立即注册</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'

const router = useRouter()
const loginForm = ref({
  username: '',
  password: ''
})
const loading = ref(false)

const handleLogin = async () => {
  if (loading.value) return
  loading.value = true
  
  try {
    const response = await request.post('/login', loginForm.value)
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    alert('登录成功')
    router.push('/')
  } catch (error) {
    console.error('登录失败:', error)
    alert('登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 4rem);
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 450px;
  padding: 2.5rem;
  text-align: center;
}

.title {
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  font-size: var(--font-size-base);
}

.login-form {
  text-align: left;
  margin-bottom: 1.5rem;
}

.login-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
}

.login-footer p {
  margin: 0;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .login-page {
    padding: 1rem;
  }
  
  .login-card {
    padding: 1.5rem;
  }
}
</style>