-- ZENO SOLAR PLATFORM - DATABASE SCHEMA FOR POSTGRESQL (TablePlus Ready)

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

-- Đồng bộ Sequence tự tăng cho SERIAL ID
SELECT setval('customers_user_id_seq', COALESCE((SELECT MAX(user_id) FROM customers), 1));
SELECT setval('customer_groups_group_id_seq', COALESCE((SELECT MAX(group_id) FROM customer_groups), 1));

