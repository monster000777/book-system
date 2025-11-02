<template>
  <div class="register-page">
    <div class="register-card card">
      <h1 class="title title-h1">创建账户</h1>
      <p class="subtitle">请输入您的信息来创建账户</p>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="username" class="form-label">用户名</label>
          <input
            id="username"
            v-model="registerForm.username"
            type="text"
            class="form-input"
            required
            placeholder="请输入用户名"
          />
        </div>
        
        <div class="form-group">
          <label for="email" class="form-label">邮箱</label>
          <input
            id="email"
            v-model="registerForm.email"
            type="email"
            class="form-input"
            required
            placeholder="请输入邮箱地址"
          />
        </div>
        
        <div class="form-group">
          <label for="password" class="form-label">密码</label>
          <input
            id="password"
            v-model="registerForm.password"
            type="password"
            class="form-input"
            required
            placeholder="请输入密码"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword" class="form-label">确认密码</label>
          <input
            id="confirmPassword"
            v-model="registerForm.confirmPassword"
            type="password"
            class="form-input"
            required
            placeholder="请再次输入密码"
          />
        </div>
        
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <div class="register-footer">
        <p>
          已有账户？
          <router-link to="/login" class="link">立即登录</router-link>
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
const registerForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})
const loading = ref(false)

const handleRegister = async () => {
  if (loading.value) return
  loading.value = true
  
  if (registerForm.value.password.length < 6) {
    alert('密码长度至少为6位')
    loading.value = false
    return
  }

  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    alert('两次输入的密码不一致')
    loading.value = false
    return
  }

  try {
    await request.post('/register', {
      username: registerForm.value.username,
      email: registerForm.value.email,
      password: registerForm.value.password
    })
    alert('注册成功')
    router.push('/login')
  } catch (error) {
    console.error('注册失败:', error)
    alert('注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 4rem);
  padding: 2rem;
}

.register-card {
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

.register-form {
  text-align: left;
  margin-bottom: 1.5rem;
}

.register-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
}

.register-footer p {
  margin: 0;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .register-page {
    padding: 1rem;
  }
  
  .register-card {
    padding: 1.5rem;
  }
}
</style>