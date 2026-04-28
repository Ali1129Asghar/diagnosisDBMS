CREATE DATABASE IF NOT EXISTS diagnostic_system;
USE diagnostic_system;


CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  duration VARCHAR(50),
  preparation VARCHAR(255),  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  test_id INT NOT NULL,
  test_name VARCHAR(100) NOT NULL,
  patient_name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  booking_date DATETIME NOT NULL,
  additional_notes TEXT,
  status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (test_id) REFERENCES tests(id)
);


INSERT INTO tests (name, description, price, duration, preparation) VALUES
('Complete Blood Count (CBC)', 'Measures various components of blood including red and white blood cells, hemoglobin, and platelets.', 500.00, '24 hours', 'Fasting not required'),
('Lipid Profile', 'Measures cholesterol and triglyceride levels in the blood.', 800.00, '24 hours', 'Fasting for 9-12 hours required'),
('Blood Glucose Test', 'Measures sugar levels in the blood.', 300.00, '6 hours', 'Fasting for 8 hours required'),
('Liver Function Test', 'Measures enzymes and proteins in the blood to assess liver health.', 1200.00, '24 hours', 'Fasting not required'),
('Kidney Function Test', 'Measures various substances to evaluate kidney function.', 1000.00, '24 hours', 'Fasting not required'),
('Thyroid Function Test', 'Measures thyroid hormone levels in the blood.', 1500.00, '48 hours', 'Fasting not required');