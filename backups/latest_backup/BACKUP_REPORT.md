# BÁO CÁO SAO LƯU DỮ LIỆU OFFLINE ZENO SOLAR

- **Thời điểm sao lưu:** 17:07:16 11/9/2026
- **Máy chủ nguồn:** https://zeno-cloud.onrender.com
- **Thư mục lưu trữ:** `/Users/5sensesimac/Downloads/SUN+WISE_1.1.7_APKPure/zeno/backups/backup_2026-09-11_17-07-16`
- **Tổng số trạm điện:** 4 trạm
- **Tổng số tài khoản:** 11 tài khoản

## 1. Danh Sách Trạm Điện Mặt Trời (Stations)

| STT | ID Trạm | Tên Trạm | Công Suất | Số Thiết Bị | Tổng Sản Lượng (kWh) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 454586755050340353 | sungoPlant | 6 kWp | 1 | 2626.77 kWh |
| 2 | 498807992005656576 | zenoPlant | 12 kWp | 1 | 0 kWh |
| 3 | 495450468162437120 | Hien_newtech.sgPlant | 12 kWp | 1 | 0 kWh |
| 4 | 178817432746558411 | phúc trung | 12 kWp | 1 | 0 kWh |

## 2. Danh Sách Tài Khoản Người Dùng & Đại Lý (Customers)

| STT | Tài Khoản | Tên Người Dùng | Vai Trò (Role) | Số Điện Thoại | Email |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | sungo.vn | SUNGO SOLAR VIỆT NAM (Master) | 👑 Tổng Phân Phối (Distributor) | 0901234567 | admin@sungo.vn |
| 2 | newtech | Đại Lý NEWTECH | 🏢 Đại Lý (Dealer) | --- | --- |
| 3 | newtech.sg | Đại Lý Newtech Solar (Nguyễn Hồng Sơn) | 🏢 Đại Lý (Dealer) | 0938123456 | newtech.sg@gmail.com |
| 4 | thodien_mientay | Đại Lý Trần Văn Hưng (Miền Tây) | 🏢 Đại Lý (Dealer) | 0933445566 | hung.solar@gmail.com |
| 5 | tuan_solar | Đại Lý Tuấn Solar Miền Nam | 🏢 Đại Lý (Dealer) | 0918765432 | --- |
| 6 | chuhanatest | Chủ Nhà Dũng Kiệp (zenoPlant) | 🏠 Người Tiêu Dùng Cuối (End-User) | 0912345678 | --- |
| 7 | dungkiep | dungkiep | 🏠 Người Tiêu Dùng Cuối (End-User) | 0912345678 | --- |
| 8 | sungo123 | sungo123 | 🏠 Người Tiêu Dùng Cuối (End-User) | --- | --- |
| 9 | triminh123 | triminh123 | Chủ Nhà / Người Dùng Cuối (View-Only) | --- | --- |
| 10 | vothehien1006 | Khách Hàng Võ Thế Hiển | 🏠 Người Tiêu Dùng Cuối (End-User) | --- | --- |
| 11 | zeno_home_9200 | Anh Nam (Chủ Nhà Thảo Điền) | 🏠 Người Tiêu Dùng Cuối (End-User) | 0988776655 | zeno_home_9200@gmail.com |

## 3. Cấu Trúc Các Tệp Đã Sao Lưu

- `stations/all_stations.json`: Toàn bộ danh sách trạm và thiết bị
- `stations/telemetry_energy_flow/`: Viễn trắc thời gian thực từng trạm (PV, Lưới, Tải, Pin)
- `stations/telemetry_history_24h/`: Biểu đồ công suất 24 giờ từng trạm
- `customers/all_customers.json`: Danh sách người dùng, đại lý, phân quyền
- `devices/all_claimed_devices.json`: Danh sách biến tần Inverter, mã DTU
- `settings/`: Cài đặt giá điện, tiêu chuẩn lưới EVN, thông số pin
- `csv_exports/`: Các tệp Excel (.csv) xem trực tiếp bằng Microsoft Excel / Google Sheets
- `database_sql/zeno_solar_offline_dump.sql`: Bản sao lưu SQL Database
