const mysql = require('mysql2/promise');
require('dotenv').config();

async function viewCategories() {
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

    // 查看所有书籍分类
    const [categories] = await connection.execute('SELECT DISTINCT category FROM books');
    console.log('书籍分类:');
    console.table(categories);

    // 查看每个分类的书籍数量
    const [categoryCounts] = await connection.execute(`
      SELECT category, COUNT(*) as count 
      FROM books 
      GROUP BY category 
      ORDER BY count DESC
    `);
    console.log('各分类书籍数量:');
    console.table(categoryCounts);

    await connection.end();
  } catch (error) {
    console.error('数据库操作出错:', error.message);
  }
}

viewCategories();