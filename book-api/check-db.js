const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
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

    // 检查users表是否存在
    const [rows] = await connection.execute("SHOW TABLES LIKE 'users'");
    console.log('Users表是否存在:', rows.length > 0);

    if (rows.length > 0) {
      // 查看users表结构
      const [desc] = await connection.execute('DESCRIBE users');
      console.log('Users表结构:');
      console.table(desc);
    } else {
      console.log('正在创建users表...');
      // 创建users表
      await connection.execute(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Users表创建成功');
    }

    // 检查books表是否存在
    const [bookRows] = await connection.execute("SHOW TABLES LIKE 'books'");
    console.log('Books表是否存在:', bookRows.length > 0);

    // 检查borrow_records表是否存在
    const [recordRows] = await connection.execute("SHOW TABLES LIKE 'borrow_records'");
    console.log('Borrow_records表是否存在:', recordRows.length > 0);

    await connection.end();
  } catch (error) {
    console.error('数据库操作出错:', error.message);
  }
}

checkDatabase();