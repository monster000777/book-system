const mysql = require('mysql2/promise');
require('dotenv').config();

async function viewPopularBooks() {
  try {
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log('数据库连接成功');

    // 查看被借阅次数最多的书籍
    const [popularBooks] = await connection.execute(`
      SELECT b.title, b.author, COUNT(br.id) as borrow_count
      FROM books b
      LEFT JOIN borrow_records br ON b.id = br.book_id
      GROUP BY b.id, b.title, b.author
      ORDER BY borrow_count DESC
      LIMIT 10
    `);
    console.log('最受欢迎的书籍:');
    console.table(popularBooks);

    // 查看当前借阅中的书籍
    const [currentBorrows] = await connection.execute(`
      SELECT b.title, b.author, u.username, br.borrow_time
      FROM borrow_records br
      JOIN books b ON br.book_id = b.id
      JOIN users u ON br.user_id = u.id
      WHERE br.return_time IS NULL
      ORDER BY br.borrow_time DESC
    `);
    console.log('当前借阅中的书籍:');
    console.table(currentBorrows);

    await connection.end();
  } catch (error) {
    console.error('数据库操作出错:', error.message);
  }
}

viewPopularBooks();