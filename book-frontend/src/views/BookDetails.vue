<template>
  <div class="book-details-page">
    <div class="container">
      <div class="page-header">
        <h1 class="title-h1">书籍详情</h1>
      </div>

      <div v-if="book" class="details-card">
        <div class="book-info-grid">
          <div class="cover-section">
            <img :src="book.coverImage || '/placeholder-book.jpg'" alt="书籍封面" class="book-cover" />
          </div>
          
          <div class="info-section">
            <h2 class="book-title">{{ book.title }}</h2>
            
            <div class="book-meta">
              <div class="meta-item">
                <span class="meta-label">作者：</span>
                <span class="meta-value">{{ book.author }}</span>
              </div>
              
              <div class="meta-item">
                <span class="meta-label">分类：</span>
                <span class="meta-value category-badge">{{ book.category }}</span>
              </div>
              
              <div class="meta-item">
                <span class="meta-label">库存：</span>
                <span :class="['meta-value', 'stock-status', book.stock > 0 ? 'stock-available' : 'stock-unavailable']">
                  {{ book.stock > 0 ? `${book.stock} 本可借` : '暂无库存' }}
                </span>
              </div>
            </div>
            
            <div class="description-section">
              <h3 class="section-title">简介</h3>
              <p class="book-description">{{ book.description }}</p>
            </div>
            
            <div class="action-section">
              <button 
                @click="handleBorrow" 
                :disabled="book.stock === 0 || loading"
                :class="['btn', 'btn-primary', { 'btn-loading': loading }]">
                <span v-if="loading">借阅中...</span>
                <span v-else>{{ book.stock === 0 ? '无库存' : '立即借阅' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="loading-state">
        <p>正在加载书籍信息...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import request from '../utils/request';

const route = useRoute();
const router = useRouter();
const book = ref(null);
const loading = ref(false);
const borrowLoading = ref(false);
const userId = ref(1); // 简化：默认用户ID为1（实际需登录）

const fetchBookDetails = async () => {
  loading.value = true;
  const { id } = route.params;
  try {
    const data = await request.get(`/books/${id}`);
    book.value = data;
  } catch (error) {
    console.error('获取书籍详情失败:', error);
    alert('获取书籍详情失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const handleBorrow = async () => {
  if (book.value.stock === 0) return;
  
  borrowLoading.value = true;
  try {
    await request.post('/borrow', { bookId: book.value.id, userId: userId.value });
    alert('借阅成功');
    fetchBookDetails(); // 刷新书籍详情
  } catch (error) {
    console.error('借阅失败:', error);
    alert('借阅失败，请稍后重试');
  } finally {
    borrowLoading.value = false;
  }
};

onMounted(() => {
  fetchBookDetails();
});
</script>

<style scoped>
.book-details-page {
  width: 100%;
  min-height: calc(100vh - 60px);
  padding: 20px 0;
  background-color: var(--background-color);
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.title-h1 {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.details-card {
  background: var(--card-background);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--box-shadow);
  padding: 30px;
  margin-bottom: 30px;
}

.book-info-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 40px;
}

.cover-section {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.book-cover {
  width: 100%;
  max-width: 250px;
  height: auto;
  border-radius: var(--border-radius-md);
  box-shadow: var(--box-shadow);
  object-fit: cover;
}

.info-section {
  display: flex;
  flex-direction: column;
}

.book-title {
  font-size: 1.8rem;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 20px 0;
}

.book-meta {
  margin-bottom: 30px;
}

.meta-item {
  display: flex;
  margin-bottom: 15px;
  align-items: center;
}

.meta-label {
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  width: 60px;
  margin-right: 15px;
}

.meta-value {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.category-badge {
  display: inline-block;
  background-color: var(--primary-color);
  color: white;
  padding: 4px 12px;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
}

.stock-status {
  font-weight: var(--font-weight-bold);
}

.stock-available {
  color: var(--success-color);
}

.stock-unavailable {
  color: var(--error-color);
}

.section-title {
  font-size: 1.3rem;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 15px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.book-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 30px 0;
}

.action-section {
  margin-top: auto;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-hover-color);
  transform: translateY(-2px);
  box-shadow: var(--box-shadow-lg);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-loading {
  position: relative;
  pointer-events: none;
}

.loading-state {
  text-align: center;
  padding: 50px 0;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .book-details-page {
    padding: 15px 0;
  }
  
  .container {
    width: 95%;
  }
  
  .details-card {
    padding: 20px;
  }
  
  .book-info-grid {
    grid-template-columns: 1fr;
    gap: 25px;
  }
  
  .cover-section {
    order: -1;
  }
  
  .book-cover {
    max-width: 180px;
  }
  
  .book-title {
    font-size: 1.5rem;
    text-align: center;
  }
  
  .book-meta {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .meta-item {
    margin-bottom: 0;
  }
  
  .section-title {
    text-align: center;
  }
}
</style>