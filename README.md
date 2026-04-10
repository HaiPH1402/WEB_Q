# ⬡ Bạc Tiên — Silver Jewelry Store

Website bán trang sức bạc cao cấp, **không cần server**, chạy hoàn toàn trên GitHub Pages.

## 📁 Cấu Trúc Dự Án

```
web_Q/
├── index.html          # Trang cửa hàng chính
├── admin.html          # Trang quản trị admin
├── products.json       # Dữ liệu sản phẩm
├── .nojekyll           # Bỏ Jekyll processing
├── css/
│   ├── style.css       # CSS trang chủ
│   └── admin.css       # CSS trang admin
└── js/
    ├── main.js         # JS trang chủ
    └── admin.js        # JS trang admin (GitHub API)
```

## 🚀 Hướng Dẫn Deploy GitHub Pages

### Bước 1: Tạo Repository
```bash
git init
git add .
git commit -m "🎉 Initial commit — Bạc Tiên Store"
```

### Bước 2: Push lên GitHub
```bash
git remote add origin https://github.com/USERNAME/REPO-NAME.git
git branch -M main
git push -u origin main
```

### Bước 3: Bật GitHub Pages
- Vào **Settings** → **Pages**
- Source: **Deploy from a branch**
- Branch: **main** → thư mục **/ (root)**
- Nhấn **Save**

### Bước 4: Website của bạn sẽ có địa chỉ:
```
https://USERNAME.github.io/REPO-NAME/
```

---

## 👤 Hướng Dẫn Dùng Admin Panel

### Truy cập Admin
```
https://USERNAME.github.io/REPO-NAME/admin.html
```
> ⚠️ Chỉ bạn mới biết đường dẫn này!

### Cấu hình GitHub API (1 lần duy nhất)

1. Vào **GitHub Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. Tạo token mới với quyền **Contents: Read & Write** cho repository
3. Vào Admin panel → **GitHub Setup**
4. Điền Username, Repository name, và Token
5. Nhấn **Kiểm Tra Kết Nối**

### Quy trình cập nhật sản phẩm
1. Vào **Sản Phẩm** → Thêm / Sửa / Xóa
2. Nhấn **🚀 Đăng Lên GitHub**
3. Website tự động cập nhật sau ~30-60 giây

---

## 💡 Thêm Ảnh Sản Phẩm

### Cách 1: URL từ Internet (Khuyến nghị)
- Upload ảnh lên [Imgur](https://imgur.com) hoặc [Cloudinary](https://cloudinary.com) (miễn phí)
- Dán URL vào ô "Thêm ảnh bằng URL" trong Admin

### Cách 2: Đặt ảnh vào repo
```
web_Q/
└── images/
    ├── nhan-bac-01.jpg
    └── day-chuyen-01.jpg
```
- Dùng đường dẫn: `images/nhan-bac-01.jpg`
- Push lên GitHub như bình thường

---

## 🛠 Tính Năng Admin

| Tính Năng | Mô Tả |
|-----------|--------|
| ➕ Thêm sản phẩm | Tên, giá, mô tả, ảnh, danh mục |
| ✏️ Sửa sản phẩm | Cập nhật mọi thông tin |
| 🗑️ Xóa sản phẩm | Xóa khỏi danh sách |
| 🖼️ Quản lý ảnh | URL hoặc upload từ máy |
| 🚀 Publish | Đẩy lên GitHub, website tự cập nhật |
| 🔄 Sync | Lấy dữ liệu mới nhất từ GitHub về |
| ⬇️ Xuất JSON | Backup dữ liệu về máy |
| ⬆️ Nhập JSON | Khôi phục từ backup |

---

## 🎨 Tùy Chỉnh

### Đổi thông tin cửa hàng
Mở `index.html` và tìm các phần:
- Tên cửa hàng: `Bạc Tiên`
- Địa chỉ, SĐT, email trong phần `#contact`
- Social links trong `<footer>`

### Đổi màu sắc
Mở `css/style.css` → phần `:root`:
```css
:root {
  --gold:    #d4af6e;  /* Màu vàng gold */
  --silver:  #c0c0c0;  /* Màu bạc */
  --dark:    #0d0d0f;  /* Màu nền tối */
}
```

---

## 📞 Liên Hệ

Được xây dựng với ❤️ — Không cần server, không cần hosting tốn tiền!
