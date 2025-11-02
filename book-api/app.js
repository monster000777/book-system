const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// 中间件
app.use(cors()); // 解决跨域
app.use(express.json()); // 解析JSON请求

// JWT验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效' });
    }
    req.user = user;
    next();
  });
};

// 用户注册
app.post('/api/register', async (req, res) => {
  const { username, password, email } = req.body;
  
  // 数据验证
  if (!username || !password || !email) {
    return res.status(400).json({ error: '用户名、密码和邮箱不能为空' });
  }
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: '邮箱格式不正确' });
  }
  
  // 验证密码强度（至少8位，包含字母和数字）
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: '密码至少8位，需包含字母和数字' });
  }
  
  // 验证用户名长度
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度需在3-20个字符之间' });
  }
  
  try {
    // 检查用户名是否已存在
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }
    
    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 插入新用户
    await pool.query(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email]
    );
    
    res.status(201).json({ message: '注册成功' });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// 用户登录
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // 数据验证
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  try {
    // 查找用户
    const [users] = await pool.query(
      'SELECT id, username, password, email FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const user = users[0];
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    // 生成JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // 返回用户信息和token（不包含密码）
    const { password: _, ...userInfo } = user;
    res.status(200).json({
      message: '登录成功',
      user: userInfo,
      token
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// ------------------- 图书相关接口 -------------------
// 1. 查询所有图书（支持按书名/作者搜索）
app.get('/api/books', async (req, res) => {
  try {
    const { keyword } = req.query;
    let sql = 'SELECT * FROM books';
    const params = [];
    
    if (keyword) {
      // 验证搜索关键词长度
      if (keyword.length > 100) {
        return res.status(400).json({ error: '搜索关键词过长' });
      }
      
      sql += ' WHERE title LIKE ? OR author LIKE ?';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    const [books] = await pool.query(sql, params);
    res.status(200).json(books);
  } catch (err) {
    console.error('查询图书错误:', err);
    res.status(500).json({ error: '查询图书失败，请稍后重试' });
  }
});

// 2. 借阅图书（库存-1 + 新增借阅记录）
app.post('/api/borrow', async (req, res) => {
  const { bookId, userId } = req.body;
  
  // 数据验证
  if (!bookId || !userId) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  // 验证参数类型
  if (isNaN(bookId) || isNaN(userId)) {
    return res.status(400).json({ error: '参数类型错误' });
  }
  
  const connection = await pool.getConnection(); // 开启事务

  try {
    await connection.beginTransaction();

    // 1. 检查图书库存
    const [books] = await connection.query('SELECT stock FROM books WHERE id = ?', [bookId]);
    if (books.length === 0) return res.status(404).json({ error: '图书不存在' });
    if (books[0].stock <= 0) return res.status(400).json({ error: '图书库存不足' });

    // 2. 库存减1
    await connection.query('UPDATE books SET stock = stock - 1 WHERE id = ?', [bookId]);

    // 3. 新增借阅记录
    await connection.query(
      'INSERT INTO borrow_records (book_id, user_id) VALUES (?, ?)',
      [bookId, userId]
    );

    await connection.commit();
    res.status(200).json({ message: '借阅成功' });
  } catch (err) {
    await connection.rollback(); // 事务回滚
    console.error('借阅错误:', err);
    res.status(500).json({ error: '借阅失败，请稍后重试' });
  } finally {
    connection.release(); // 释放连接
  }
});

// 3. 归还图书（库存+1 + 更新归还时间）
app.post('/api/return', async (req, res) => {
  const { recordId } = req.body;
  
  // 数据验证
  if (!recordId) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  // 验证参数类型
  if (isNaN(recordId)) {
    return res.status(400).json({ error: '参数类型错误' });
  }
  
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. 检查借阅记录（未归还）
    const [records] = await connection.query(
      'SELECT book_id FROM borrow_records WHERE id = ? AND return_time IS NULL',
      [recordId]
    );
    if (records.length === 0) return res.status(404).json({ error: '未找到待归还记录' });

    const bookId = records[0].book_id;

    // 2. 库存加1
    await connection.query('UPDATE books SET stock = stock + 1 WHERE id = ?', [bookId]);

    // 3. 更新归还时间
    await connection.query(
      'UPDATE borrow_records SET return_time = CURRENT_TIMESTAMP WHERE id = ?',
      [recordId]
    );

    await connection.commit();
    res.status(200).json({ message: '归还成功' });
  } catch (err) {
    await connection.rollback();
    console.error('归还错误:', err);
    res.status(500).json({ error: '归还失败，请稍后重试' });
  } finally {
    connection.release();
  }
});

// 启动服务
app.listen(PORT, () => {
  console.log(`后端服务运行中：http://localhost:${PORT}`);
});

// 获取图书详情
app.get('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [books] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    if (books.length === 0) {
      return res.status(404).json({ error: '图书不存在' });
    }
    res.status(200).json(books[0]);
  } catch (err) {
    res.status(500).json({ error: '查询图书详情失败' });
  }
});

// 补充：按分类查询图书
app.get('/api/books/category', async (req, res) => {
  const { category } = req.query;
  try {
    const [books] = await pool.query(
      'SELECT * FROM books WHERE category = ?',
      [category]
    );
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ error: '按分类查询失败' });
  }
});

// 补充：查询用户的借阅记录（含图书信息）
app.get('/api/borrow/user', async (req, res) => {
  const { userId } = req.query;
  try {
    const [records] = await pool.query(
      `SELECT br.*, b.title, b.author, b.category 
       FROM borrow_records br 
       JOIN books b ON br.book_id = b.id 
       WHERE br.user_id = ?`,
      [userId]
    );
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ error: '查询借阅记录失败' });
  }
});

// 补充：新增图书（管理员）
app.post('/api/books/add', authenticateToken, async (req, res) => {
  const { isbn, title, author, category, stock, publish_date } = req.body;
  
  // 数据验证
  if (!isbn || !title || !author || !category || stock === undefined) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  // 验证ISBN格式（10位或13位数字）
  const isbnRegex = /^(?:\d{10}|\d{13})$/;
  if (!isbnRegex.test(isbn)) {
    return res.status(400).json({ error: 'ISBN格式不正确' });
  }
  
  // 验证库存数量
  if (isNaN(stock) || stock < 0) {
    return res.status(400).json({ error: '库存数量必须为非负整数' });
  }
  
  try {
    // 检查ISBN是否存在
    const [exists] = await pool.query('SELECT id FROM books WHERE isbn = ?', [isbn]);
    if (exists.length > 0) {
      return res.status(400).json({ error: 'ISBN已存在' });
    }
    
    // 插入新图书
    await pool.query(
      'INSERT INTO books (isbn, title, author, category, stock, publish_date) VALUES (?, ?, ?, ?, ?, ?)',
      [isbn, title, author, category, stock, publish_date]
    );
    res.status(200).json({ message: '图书新增成功' });
  } catch (err) {
    console.error('新增图书错误:', err);
    res.status(500).json({ error: '新增图书失败，请稍后重试' });
  }
});

// 更新图书信息
app.put('/api/books/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { isbn, title, author, category, stock, publish_date } = req.body;
  
  // 数据验证
  if (!id) {
    return res.status(400).json({ error: '缺少图书ID' });
  }
  
  // 验证参数类型
  if (isNaN(id)) {
    return res.status(400).json({ error: '图书ID必须为数字' });
  }
  
  // 验证必需字段
  if (!isbn || !title || !author || !category || stock === undefined) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  // 验证ISBN格式（10位或13位数字）
  const isbnRegex = /^(?:\d{10}|\d{13})$/;
  if (!isbnRegex.test(isbn)) {
    return res.status(400).json({ error: 'ISBN格式不正确' });
  }
  
  // 验证库存数量
  if (isNaN(stock) || stock < 0) {
    return res.status(400).json({ error: '库存数量必须为非负整数' });
  }
  
  try {
    // 检查图书是否存在
    const [existingBook] = await pool.query('SELECT id FROM books WHERE id = ?', [id]);
    if (existingBook.length === 0) {
      return res.status(404).json({ error: '图书不存在' });
    }
    
    // 更新图书信息
    await pool.query(
      'UPDATE books SET isbn = ?, title = ?, author = ?, category = ?, stock = ?, publish_date = ? WHERE id = ?',
      [isbn, title, author, category, stock, publish_date, id]
    );
    res.status(200).json({ message: '图书更新成功' });
  } catch (err) {
    console.error('更新图书错误:', err);
    res.status(500).json({ error: '更新图书失败，请稍后重试' });
  }
});

// 删除图书
app.delete('/api/books/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  // 数据验证
  if (!id) {
    return res.status(400).json({ error: '缺少图书ID' });
  }
  
  // 验证参数类型
  if (isNaN(id)) {
    return res.status(400).json({ error: '图书ID必须为数字' });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 检查图书是否存在
    const [existingBook] = await connection.query('SELECT id FROM books WHERE id = ?', [id]);
    if (existingBook.length === 0) {
      return res.status(404).json({ error: '图书不存在' });
    }
    
    // 检查是否有未归还的借阅记录
    const [unreturned] = await connection.query(
      'SELECT id FROM borrow_records WHERE book_id = ? AND return_time IS NULL',
      [id]
    );
    
    if (unreturned.length > 0) {
      return res.status(400).json({ error: '该图书有未归还记录，无法删除' });
    }
    
    // 删除相关的借阅记录
    await connection.query('DELETE FROM borrow_records WHERE book_id = ?', [id]);
    
    // 删除图书
    await connection.query('DELETE FROM books WHERE id = ?', [id]);
    
    await connection.commit();
    res.status(200).json({ message: '图书删除成功' });
  } catch (err) {
    await connection.rollback();
    console.error('删除图书错误:', err);
    res.status(500).json({ error: '删除图书失败，请稍后重试' });
  } finally {
    connection.release();
  }
});

// 启动服务
app.listen(PORT, () => {
  console.log(`后端服务运行中：http://localhost:${PORT}`);
});