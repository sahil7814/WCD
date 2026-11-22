INSERT INTO users (full_name, email, password_hash, role)
VALUES ('WCD Administrator', 'admin@wcd.hp.gov.in', '$2b$10$wDA.npbYUBXTFciqYSMbeOhPyPdVJEOczLe0yHBfyBWLr3UpFTxRW', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Seed login password: WCD@123
