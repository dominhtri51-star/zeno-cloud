-- ZENO SOLAR PLATFORM - DATABASE SCHEMA FOR POSTGRESQL (TablePlus Ready)

-- Tạo không gian Schema riêng cho Zeno Solar Platform
CREATE SCHEMA IF NOT EXISTS zeno;
SET search_path TO zeno, public;

-- 1. Bảng Nhóm Khách Hàng / Chi Nhánh
CREATE TABLE IF NOT EXISTS customer_groups (
    group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Khách Hàng (Tài khoản cấp dưới trên Siseli / SUN WISE)
CREATE TABLE IF NOT EXISTS customers (
    user_id SERIAL PRIMARY KEY,
    account VARCHAR(100) UNIQUE NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    cellphone VARCHAR(50),
    user_type INT DEFAULT 1, -- 1: Owner, 2: Installer, 3: Ordinary
    role_name VARCHAR(100) DEFAULT 'Chủ sở hữu (Owner)',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    group_id INT REFERENCES customer_groups(group_id) ON DELETE SET NULL,
    siseli_user_id VARCHAR(100),
    password_hash VARCHAR(255),
    cloud_password VARCHAR(255) DEFAULT '123456',
    zeno_password VARCHAR(255) DEFAULT 'sungo123',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Trạm Năng Lượng & Pin Lưu Trữ
CREATE TABLE IF NOT EXISTS stations (
    station_id VARCHAR(100) PRIMARY KEY,
    station_name VARCHAR(200) NOT NULL,
    customer_id INT REFERENCES customers(user_id) ON DELETE CASCADE,
    address TEXT,
    capacity_kw NUMERIC(10, 2) DEFAULT 10.0,
    current_power_kw NUMERIC(10, 2) DEFAULT 0.0,
    today_energy_kwh NUMERIC(10, 2) DEFAULT 0.0,
    total_energy_kwh NUMERIC(10, 2) DEFAULT 0.0,
    battery_soc INT DEFAULT 85,
    pv_power_kw NUMERIC(10, 2) DEFAULT 0.0,
    battery_power_kw NUMERIC(10, 2) DEFAULT 0.0,
    load_power_kw NUMERIC(10, 2) DEFAULT 0.0,
    grid_power_kw NUMERIC(10, 2) DEFAULT 0.0,
    grid_status VARCHAR(50) DEFAULT 'NORMAL',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Cảnh Báo Sự Cố & Chẩn Đoán BMS
CREATE TABLE IF NOT EXISTS alarms (
    alarm_id VARCHAR(100) PRIMARY KEY,
    station_id VARCHAR(100) REFERENCES stations(station_id) ON DELETE CASCADE,
    device_sn VARCHAR(100),
    level VARCHAR(50) DEFAULT 'WARNING', -- WARNING, INFO, ERROR
    type VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Nhật Ký Gọi API Siseli Cloud (Audit Sync Logs - TablePlus)
CREATE TABLE IF NOT EXISTS api_sync_logs (
    log_id SERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(20) NOT NULL,
    status_code INT,
    request_payload JSONB,
    response_payload JSONB,
    client_ip VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng Cài Đặt Thông Số Riêng Từng Dự Án (Project / Station Settings)
CREATE TABLE IF NOT EXISTS station_settings (
    station_id VARCHAR(100) PRIMARY KEY,
    settings JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bảng Mã Kỹ Thuật Viên / Đại Lý (Dealer / Installer Technician Codes)
CREATE TABLE IF NOT EXISTS technician_codes (
    code VARCHAR(50) PRIMARY KEY,
    dealer_name VARCHAR(150) NOT NULL,
    account VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Bảng Thiết Bị Inverter Đã Liên Kết (Claimed Devices & Ownership)
CREATE TABLE IF NOT EXISTS devices (
    device_id VARCHAR(100) PRIMARY KEY,
    serial_number VARCHAR(100),
    dtu_code VARCHAR(100),
    station_name VARCHAR(200),
    customer VARCHAR(100),
    installer VARCHAR(100),
    distributor VARCHAR(100),
    details JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tự động cập nhật sequence nếu có
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'customers_user_id_seq') THEN
        PERFORM setval('customers_user_id_seq', COALESCE((SELECT MAX(user_id) FROM customers), 1));
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'customer_groups_group_id_seq') THEN
        PERFORM setval('customer_groups_group_id_seq', COALESCE((SELECT MAX(group_id) FROM customer_groups), 1));
    END IF;
END $$;


