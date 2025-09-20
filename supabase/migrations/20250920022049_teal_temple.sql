/*
  # سیستم فعال‌سازی نرم‌افزار

  1. جداول جدید
    - `activation_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique) - کد فعال‌سازی
      - `license_type` (text) - نوع مجوز (admin, trial)
      - `is_active` (boolean) - وضعیت فعال بودن
      - `is_used` (boolean) - آیا استفاده شده
      - `used_by` (text) - شناسه کاربری که استفاده کرده
      - `used_at` (timestamptz) - زمان استفاده
      - `expires_at` (timestamptz) - تاریخ انقضا
      - `created_at` (timestamptz)
      - `purchase_info` (jsonb) - اطلاعات خرید

    - `license_activations`
      - `id` (uuid, primary key)
      - `activation_code` (text)
      - `device_fingerprint` (text) - شناسه دستگاه
      - `user_agent` (text)
      - `ip_address` (text)
      - `activated_at` (timestamptz)
      - `last_check` (timestamptz)
      - `is_active` (boolean)

  2. امنیت
    - Enable RLS on all tables
    - Add policies for secure access
*/

-- جدول کدهای فعال‌سازی
CREATE TABLE IF NOT EXISTS activation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  license_type text NOT NULL CHECK (license_type IN ('admin', 'trial')),
  is_active boolean DEFAULT true,
  is_used boolean DEFAULT false,
  used_by text,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  purchase_info jsonb DEFAULT '{}'::jsonb
);

-- جدول فعال‌سازی‌های انجام شده
CREATE TABLE IF NOT EXISTS license_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_code text NOT NULL,
  device_fingerprint text NOT NULL,
  user_agent text,
  ip_address text,
  activated_at timestamptz DEFAULT now(),
  last_check timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(activation_code, device_fingerprint)
);

-- فعال‌سازی RLS
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_activations ENABLE ROW LEVEL SECURITY;

-- سیاست‌های امنیتی برای activation_codes
CREATE POLICY "Public can validate codes"
  ON activation_codes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- سیاست‌های امنیتی برای license_activations
CREATE POLICY "Users can manage their activations"
  ON license_activations
  FOR ALL
  TO anon, authenticated
  USING (true);

-- درج کدهای تست
INSERT INTO activation_codes (code, license_type, expires_at) VALUES
  ('HESA-ADMIN-2025-001', 'admin', NULL),
  ('HESA-TRIAL-2025-002', 'trial', now() + interval '1 day')
ON CONFLICT (code) DO NOTHING;