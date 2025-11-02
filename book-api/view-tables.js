const mysql = require('mysql2/promise');
require('dotenv').config();

async function viewTables() {
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

    // 查看books表结构
    const [bookDesc] = await connection.execute('DESCRIBE books');
    console.log('Books表结构:');
    console.table(bookDesc);

    // 查看borrow_records表结构
    const [recordDesc] = await connection.execute('DESCRIBE borrow_records');
    console.log('Borrow_records表结构:');
    console.table(recordDesc);

    // 查看所有书籍数据
    const [books] = await connection.execute('SELECT * FROM books');
    console.log('Books所有数据:');
    console.table(books);

    // 查看所有借阅记录数据
    const [records] = await connection.execute('SELECT * FROM borrow_records');
    console.log('Borrow_records所有数据:');
    console.table(records);

    await connection.end();
  } catch (error) {
    console.error('数据库操作出错:', error.message);
  }
}

viewTables();