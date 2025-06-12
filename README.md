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
online-marketplace/
├── marketplace-frontend/       # Vue.js + Vite project
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
├── marketplace-backend/        # NestJS project
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
git clone https://github.com/yourusername/online-marketplace.git
cd online-marketplace
```

---

### 🧩 Thiết lập Backend (NestJS)

1. **Di chuyển vào thư mục backend:**
   ```bash
   cd marketplace-backend
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Cấu hình environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Cập nhật file `.env`:**
   ```env
   NODE_ENV=development
   PORT=3000

   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/marketplace"

   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRATION=7d

   # Stripe
   STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

   # Frontend URL
   FRONTEND_URL=http://localhost:8080
   ```

5. **Khởi động PostgreSQL với Docker (optional):**
   ```bash
   docker-compose up -d
   ```

6. **Chạy migrations:**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

7. **Seed database (optional):**
   ```bash
   npx prisma db seed
   ```

8. **Chạy backend:**
   ```bash
   npm run start:dev
   ```

Backend sẽ chạy tại: `http://localhost:3000/api/v1`

---

### 💻 Thiết lập Frontend (Vue.js + Vite)

1. **Mở terminal mới và di chuyển vào thư mục frontend:**
   ```bash
   cd marketplace-frontend
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Cấu hình environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Cập nhật file `.env`:**
   ```env
   VITE_API_URL=http://localhost:3000/api/v1
   VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
   ```

5. **Chạy frontend:**
   ```bash
   npm run dev
   ```

Frontend sẽ chạy tại: `http://localhost:8080`

---

## 🔑 Tài khoản test

### Admin
- Email: admin@marketplace.com
- Password: admin123

### User
- Email: user@example.com
- Password: password123

### Stripe Test Cards
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

---

## 📸 Screenshots

### Homepage
![Homepage](./screenshots/homepage.png)

### Product List
![Products](./screenshots/products.png)

### Shopping Cart
![Cart](./screenshots/cart.png)

### Admin Dashboard
![Admin](./screenshots/admin.png)

---

## 🚀 Build & Deploy

### Build Frontend
```bash
cd marketplace-frontend
npm run build
```

### Build Backend
```bash
cd marketplace-backend
npm run build
```

### Deploy với Docker
```bash
docker-compose -f docker-compose.production.yml up -d
```

---

## 📝 API Documentation

API documentation có thể truy cập tại: `http://localhost:3000/api/docs`

### Ví dụ API Endpoints:

```bash
# Auth
POST   /api/v1/auth/register
POST   /api/v1/auth/login

# Products
GET    /api/v1/products
GET    /api/v1/products/:id
POST   /api/v1/products
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id

# Orders
GET    /api/v1/orders
POST   /api/v1/orders
GET    /api/v1/orders/:id
```

---

## 🤝 Đóng góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📧 Liên hệ

Your Name - [@yourtwitter](https://twitter.com/yourtwitter) - email@example.com

Project Link: [https://github.com/yourusername/online-marketplace](https://github.com/yourusername/online-marketplace)

---

## 🙏 Acknowledgments

- [Vue.js](https://vuejs.org/)
- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [Stripe](https://stripe.com/)
- [Materialize CSS](https://materializecss.com/)