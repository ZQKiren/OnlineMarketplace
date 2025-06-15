# 🛒 Online Marketplace Web Application

## 📝 Giới thiệu

**Online Marketplace** là một ứng dụng web thương mại điện tử Full Stack, cho phép người dùng tạo hồ sơ, đăng bán sản phẩm, duyệt danh sách sản phẩm, quản lý giỏ hàng, và để lại đánh giá. Ứng dụng hỗ trợ giao dịch an toàn thông qua Stripe, cập nhật dữ liệu theo thời gian thực, và cung cấp dashboard cho admin để quản lý toàn bộ hệ thống.

⏱️ **Thời gian phát triển dự kiến:** 40-50 giờ

---

## 🛠️ Công nghệ sử dụng

### 💻 Frontend (Vue.js + Vite)
- Vue.js 3 với Composition API
- Vite
- Vue Router
- Pinia (State Management)
- Materialize CSS
- Axios
- Stripe.js
- Vue Toastification

### 🌐 Backend (NestJS)
- NestJS Framework
- TypeScript
- Prisma ORM (Code First)
- PostgreSQL
- Authentication: JWT
- Payment: Stripe API
- File Upload: Multer
- Validation: class-validator

---

## ⚙️ Tính năng chính

### 👤 Người dùng
- ✅ Đăng ký và đăng nhập (JWT Authentication)
- ✅ Quản lý hồ sơ cá nhân
- ✅ Duyệt và tìm kiếm sản phẩm với bộ lọc nâng cao
- ✅ Quản lý giỏ hàng
- ✅ Thanh toán an toàn qua Stripe
- ✅ Theo dõi đơn hàng
- ✅ Đánh giá sản phẩm sau khi mua
- ✅ Đăng bán sản phẩm của riêng mình

### 👨‍💼 Admin
- ✅ Dashboard thống kê tổng quan
- ✅ Quản lý sản phẩm (duyệt, xóa, chỉnh sửa)
- ✅ Quản lý đơn hàng (cập nhật trạng thái)
- ✅ Quản lý người dùng (khóa tài khoản)
- ✅ Quản lý danh mục sản phẩm
- ✅ Báo cáo doanh thu

### 🔔 Tính năng nổi bật
- 📱 Responsive design trên mọi thiết bị
- 🔍 Tìm kiếm và lọc sản phẩm theo nhiều tiêu chí
- 💳 Tích hợp thanh toán Stripe
- 📊 Thống kê và báo cáo chi tiết
- 🔒 Bảo mật với JWT và role-based access control

---

## 📂 Cấu trúc thư mục

```bash
Online_Marketplace/
├── marketplace_fe/       # Vue.js + Vite project
│   ├── src/
│   │   ├── assets/            # Images, styles
│   │   ├── components/        # Reusable components
│   │   ├── views/            # Page components
│   │   ├── stores/           # Pinia stores
│   │   ├── services/         # API services
│   │   ├── router/           # Vue Router
│   │   └── utils/            # Helper functions
│   └── package.json
│
├── marketplace_be/        # NestJS project
│   ├── src/
│   │   ├── auth/             # Authentication module
│   │   ├── users/            # Users module
│   │   ├── products/         # Products module
│   │   ├── categories/       # Categories module
│   │   ├── cart/             # Cart module
│   │   ├── orders/           # Orders module
│   │   ├── payments/         # Payments module
│   │   ├── reviews/          # Reviews module
│   │   ├── admin/            # Admin module
│   │   └── prisma/           # Database module
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── package.json
│
└── README.md
```

---

## ⚙️ Hướng dẫn cài đặt và chạy dự án

### ⚠️ Yêu cầu môi trường

- [Node.js v16+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) hoặc Docker
- [Stripe Account](https://stripe.com/) (để test thanh toán)
- Git
- npm hoặc yarn

---

### 1️⃣ Clone dự án

```bash
git clone https://github.com/yourusername/OnlineMarketplace.git
cd online-marketplace
```

---

### 🧩 Thiết lập Backend (NestJS)

1. **Di chuyển vào thư mục backend:**
   ```bash
   cd marketplace_be
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Cấu hình environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Khởi động PostgreSQL với Docker (optional):**
   ```bash
   docker-compose up -d
   ```

5. **Chạy backend:**
   ```bash
   npm start
   ```

Backend sẽ chạy tại: `http://localhost:3000/api/v1`

---

### 💻 Thiết lập Frontend (Vue.js + Vite)

1. **Mở terminal mới và di chuyển vào thư mục frontend:**
   ```bash
   cd marketplace_fe
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Cấu hình environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Chạy frontend:**
   ```bash
   npm run dev
   ```

Frontend sẽ chạy tại: `http://localhost:3000`

---

## 🚀 Build & Deploy

### Build Frontend
```bash
cd marketplace_fe
npm run build
```

### Build Backend
```bash
cd marketplace_be
npm run build
```

### Deploy với Docker
```bash
docker-compose -f docker-compose.production.yml up -d
```

---

## 📝 API Documentation

API documentation có thể truy cập tại: `http://localhost:3000/api/docs`


## 📧 Liên hệ

0509_Nguyễn Đỗ Quốc Huy - baohuynguyendo@gmail.com

Project Link: [https://github.com/ZQKiren/OnlineMarketplace.git]

---

## 🙏 Acknowledgments

- [Vue.js](https://vuejs.org/)
- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [Stripe](https://stripe.com/)
- [Materialize CSS](https://materializecss.com/)