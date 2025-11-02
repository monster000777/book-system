# 图书管理系统数据库总结报告

## 数据库结构

### 1. Users表（用户表）
- **字段**：
  - id: 用户ID（主键，自增）
  - username: 用户名（唯一）
  - password: 密码（加密存储）
  - email: 邮箱（唯一）
  - created_at: 账户创建时间

### 2. Books表（图书表）
- **字段**：
  - id: 图书ID（主键，自增）
  - title: 书名
  - author: 作者
  - isbn: ISBN编号
  - category: 分类
  - description: 描述
  - stock: 库存数量
  - created_at: 创建时间
  - updated_at: 更新时间

### 3. Borrow_records表（借阅记录表）
- **字段**：
  - id: 记录ID（主键，自增）
  - book_id: 图书ID（外键）
  - user_id: 用户ID（外键）
  - borrow_time: 借阅时间
  - return_time: 归还时间（未归还时为NULL）

## 数据统计

### 用户统计
- 总用户数：3人
- 用户详情：
  - testuser（test@example.com）：借阅31次
  - monster（zouweng73@gmail.com）：借阅4次
  - monster7（1170844693@qq.com）：借阅2次

### 图书统计
- 总图书数：14本
- 图书分类：
  - 文学：3本
  - 科幻：3本
  - 历史：3本
  - 心理学：2本
  - 商业：2本
  - 推理：2本
  - ????：1本

### 借阅统计
- 总借阅记录：39条
- 当前未归还图书：14本
- 最受欢迎的图书：
  1. 《红楼梦》（曹雪芹）- 被借阅7次
  2. 《活着》（余华）- 被借阅3次
  3. 《朝花夕拾》（鲁迅）- 被借阅3次

## 数据库连接配置
- 数据库类型：MySQL
- 主机：localhost
- 端口：3306
- 数据库名：book_management_system
- 用户名：root
- 密码：root

## 技术栈
- 后端框架：Express.js
- 数据库驱动：mysql2
- 其他依赖：bcryptjs（密码加密）、jsonwebtoken（身份验证）、cors（跨域处理）、dotenv（环境变量管理）