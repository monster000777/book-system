<template>
  <div class="book-manage-page">
    <div class="header-section">
      <h1 class="title title-h1">图书管理系统</h1>
      
      <!-- 搜索栏 -->
      <div class="search-bar">
        <div class="search-input-wrapper">
          <input 
            v-model="keyword" 
            placeholder="输入书名/作者搜索" 
            @keyup.enter="getBooks"
            class="form-input search-input"
          />
          <button @click="getBooks" class="btn btn-primary search-btn">搜索</button>
        </div>
        <div class="header-actions">
          <button v-if="currentUser" @click="showAddModal = true" class="btn btn-primary">新增图书</button>
          <button @click="handleLogout" class="btn btn-outline">退出</button>
        </div>
      </div>
    </div>

    <!-- 图书列表 -->
    <div class="books-table-container card">
      <table class="books-table">
        <thead>
          <tr>
            <th>ISBN</th>
            <th>书名</th>
            <th>作者</th>
            <th>分类</th>
            <th>库存</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="book in bookList" :key="book.id">
            <td>{{ book.isbn }}</td>
            <td>
              <router-link :to="`/book/${book.id}`" class="book-link">
                {{ book.title }}
              </router-link>
            </td>
            <td>{{ book.author }}</td>
            <td>{{ book.category }}</td>
            <td>
              <span :class="book.stock > 0 ? 'stock-available' : 'stock-unavailable'">
                {{ book.stock === 0 ? '无库存' : book.stock }}
              </span>
            </td>
            <td>
              <button 
                @click="handleBorrow(book.id)" 
                class="btn btn-primary btn-small" 
                :disabled="book.stock === 0"
              >
                借阅
              </button>
              <!-- 管理员功能 -->
              <button 
                v-if="currentUser" 
                @click="editBook(book)" 
                class="btn btn-secondary btn-small"
              >
                编辑
              </button>
              <button 
                v-if="currentUser" 
                @click="deleteBook(book.id)" 
                class="btn btn-outline btn-small"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新增/编辑图书弹窗 -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content card" @click.stop>
        <div class="modal-header">
          <h3 class="title title-h3">{{ showEditModal ? '编辑图书' : '新增图书' }}</h3>
          <span class="close" @click="closeModal">&times;</span>
        </div>
        <form @submit.prevent="saveBook" class="modal-form">
          <div class="form-group">
            <label for="isbn" class="form-label">ISBN:</label>
            <input id="isbn" v-model="bookForm.isbn" type="text" required class="form-input" />
          </div>
          <div class="form-group">
            <label for="title" class="form-label">书名:</label>
            <input id="title" v-model="bookForm.title" type="text" required class="form-input" />
          </div>
          <div class="form-group">
            <label for="author" class="form-label">作者:</label>
            <input id="author" v-model="bookForm.author" type="text" required class="form-input" />
          </div>
          <div class="form-group">
            <label for="category" class="form-label">分类:</label>
            <input id="category" v-model="bookForm.category" type="text" required class="form-input" />
          </div>
          <div class="form-group">
            <label for="stock" class="form-label">库存:</label>
            <input id="stock" v-model="bookForm.stock" type="number" min="0" required class="form-input" />
          </div>
          <div class="form-group">
            <label for="publish_date" class="form-label">出版日期:</label>
            <input id="publish_date" v-model="bookForm.publish_date" type="date" class="form-input" />
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-outline">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 归还记录弹窗 -->
    <div v-if="showReturnModal" class="modal-overlay" @click="showReturnModal = false">
      <div class="modal-content card return-modal" @click.stop>
        <div class="modal-header">
          <h3 class="title title-h3">待归还记录</h3>
          <span class="close" @click="showReturnModal = false">&times;</span>
        </div>
        <div class="modal-body">
          <table>
            <thead>
              <tr>
                <th>书名</th>
                <th>借阅时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in borrowRecords" :key="record.id">
                <td>{{ record.title }}</td>
                <td>{{ record.borrow_time }}</td>
                <td>
                  <button @click="handleReturn(record.id)" class="btn btn-primary btn-small return-btn">归还</button>
                </td>
              </tr>
            </tbody>
          </table>
          <button @click="showReturnModal = false" class="btn btn-outline close-btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '../utils/request';

const router = useRouter();

// 状态管理
const keyword = ref('');
const bookList = ref([]);
const showReturnModal = ref(false);
const showAddModal = ref(false);
const showEditModal = ref(false);
const borrowRecords = ref([]);
const currentUser = ref(null);
const userId = ref(null);

// 图书表单数据
const bookForm = ref({
  id: null,
  isbn: '',
  title: '',
  author: '',
  category: '',
  stock: 0,
  publish_date: ''
});

// 页面加载时检查用户登录状态
onMounted(() => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    currentUser.value = JSON.parse(user);
    userId.value = currentUser.value.id;
  } else {
    // 未登录跳转到登录页
    router.push('/login');
    return;
  }
  
  getBooks();
  getBorrowRecords();
});

// 1. 获取图书列表
const getBooks = async () => {
  try {
    const data = await request.get('/books', { params: { keyword: keyword.value } });
    bookList.value = data;
  } catch (error) {
    console.error('获取图书列表失败:', error);
    alert('获取图书列表失败，请稍后重试');
  }
};

// 2. 借阅图书
const handleBorrow = async (bookId) => {
  try {
    await request.post('/borrow', { bookId, userId: userId.value });
    getBooks(); // 刷新图书列表
    getBorrowRecords(); // 刷新借阅记录
    alert('借阅成功');
  } catch (error) {
    console.error('借阅失败:', error);
    alert('借阅失败，请稍后重试');
  }
};

// 3. 获取待归还记录
const getBorrowRecords = async () => {
  try {
    const data = await request.get('/borrow/user', { params: { userId: userId.value } });
    borrowRecords.value = data;
  } catch (error) {
    console.error('获取借阅记录失败:', error);
  }
};

// 4. 归还图书
const handleReturn = async (recordId) => {
  try {
    await request.post('/return', { recordId });
    getBorrowRecords(); // 刷新记录
    getBooks(); // 刷新图书库存
    alert('归还成功');
  } catch (error) {
    console.error('归还失败:', error);
    alert('归还失败，请稍后重试');
  }
};

// 5. 用户退出
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser.value = null;
  router.push('/login');
};

// 6. 编辑图书
const editBook = (book) => {
  bookForm.value = { ...book };
  showEditModal.value = true;
};

// 7. 删除图书
const deleteBook = async (bookId) => {
  if (!confirm('确定要删除这本书吗？')) return;
  
  try {
    await request.delete(`/books/${bookId}`);
    getBooks(); // 刷新图书列表
    alert('删除成功');
  } catch (error) {
    console.error('删除失败:', error);
    alert('删除失败，请稍后重试');
  }
};

// 8. 保存图书（新增或编辑）
const saveBook = async () => {
  try {
    if (showEditModal.value) {
      // 编辑图书
      await request.put(`/books/${bookForm.value.id}`, bookForm.value);
      alert('更新成功');
    } else {
      // 新增图书
      await request.post('/books/add', bookForm.value);
      alert('新增成功');
    }
    closeModal();
    getBooks(); // 刷新图书列表
  } catch (error) {
    console.error('保存失败:', error);
    alert('保存失败，请稍后重试');
  }
};

// 9. 关闭弹窗
const closeModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  bookForm.value = {
    id: null,
    isbn: '',
    title: '',
    author: '',
    category: '',
    stock: 0,
    publish_date: ''
  };
};
</script>

<style scoped>
.book-manage-page {
  width: 90%;
  margin: 20px auto;
  padding: 20px 0;
}

.header-section {
  margin-bottom: 30px;
}

.header-section h1 {
  text-align: center;
  margin-bottom: 30px;
}

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.search-input-wrapper {
  display: flex;
  gap: 10px;
  flex: 1;
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.books-table-container {
  overflow-x: auto;
  padding: 0;
}

.books-table {
  width: 100%;
  border-collapse: collapse;
}

.books-table th,
.books-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.books-table th {
  background-color: var(--surface-color);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  font-size: var(--font-size-sm);
  letter-spacing: 0.5px;
}

.books-table tbody tr:hover {
  background-color: rgba(67, 97, 238, 0.05);
}

.book-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
}

.book-link:hover {
  text-decoration: underline;
}

.stock-available {
  color: var(--success-color);
  font-weight: var(--font-weight-medium);
}

.stock-unavailable {
  color: var(--error-color);
  font-weight: var(--font-weight-medium);
}

.btn-small {
  padding: 6px 12px;
  font-size: var(--font-size-sm);
  min-width: auto;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
}

.close {
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
}

.close:hover {
  color: var(--text-primary);
}

.modal-form {
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.return-modal .modal-body {
  margin-bottom: 20px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
}

.record-details {
  flex: 1;
}

.record-details p {
  margin: 5px 0;
}

.returned-badge {
  background-color: var(--success-color);
  color: white;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}

.no-records {
  text-align: center;
  padding: 30px;
  color: var(--text-secondary);
}

.actions {
  margin-top: 30px;
  text-align: center;
}

@media (max-width: 768px) {
  .book-manage-page {
    width: 95%;
    padding: 10px 0;
  }

  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input-wrapper {
    margin-bottom: 15px;
  }

  .header-actions {
    justify-content: center;
  }

  .books-table {
    font-size: var(--font-size-sm);
  }

  .books-table th,
  .books-table td {
    padding: 10px 8px;
  }

  .modal-content {
    width: 95%;
    margin: 10px;
  }

  .record-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>