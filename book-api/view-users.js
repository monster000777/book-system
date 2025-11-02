const mysql = require('mysql2/promise');
require('dotenv').config();

async function viewUsers() {
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

    // 查看所有用户
    const [users] = await connection.execute('SELECT id, username, email, created_at FROM users');
    console.log('用户列表:');
    console.table(users);

    // 查看用户的借阅统计
    const [userBorrows] = await connection.execute(`
      SELECT u.username, COUNT(br.id) as total_borrows
      FROM users u
      LEFT JOIN borrow_records br ON u.id = br.user_id
      GROUP BY u.id, u.username
      ORDER BY total_borrows DESC
    `);
    console.log('用户借阅统计:');
    console.table(userBorrows);

    await connection.end();
  } catch (error) {
    console.error('数据库操作出错:', error.message);
  }
}

viewUsers();