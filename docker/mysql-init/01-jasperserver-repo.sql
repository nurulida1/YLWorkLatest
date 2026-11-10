-- Runs once when the Jasper MySQL data volume is first created.
-- JasperReports Server repository (internal metadata only — not yl_works).
CREATE DATABASE IF NOT EXISTS jasperserver
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
