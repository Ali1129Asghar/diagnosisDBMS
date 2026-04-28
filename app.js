  const express = require('express');
  const mysql = require('mysql2');
  const bodyParser = require('body-parser');
  const session = require('express-session');
  const path = require('path');
  const bcrypt = require('bcrypt');
  const methodOverride = require('method-override');
  const favicon = require('serve-favicon');
  const saltRounds = 10;
  const fs = require('fs');

  const app = express();

  // Database connection
 const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'smokey@1129',
  database: 'diagnostic_system',
  port: 3306
});

  // Connect to database
  db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
  });

  // Middleware
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(methodOverride('_method'));
  app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }
  }));
  app.use(express.static(path.join(__dirname, 'public')));
  const faviconPath = path.join(__dirname, 'public', 'favicon.ico');
  if (fs.existsSync(faviconPath)) {
    app.use(favicon(faviconPath));
  } else {
    app.get('/favicon.ico', (req, res) => res.status(204).end());
  }
    // Rest of your code remains the same...

  // Set view engine
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  // Flash messages middleware
  app.use((req, res, next) => {
    res.locals.success = req.session.success;
    res.locals.error = req.session.error;
    delete req.session.success;
    delete req.session.error;
    next();
  });

  // Routes
  app.get('/', (req, res) => {
    res.render('home', { loggedin: req.session.loggedin, email: req.session.email });
  });

  app.get('/home', (req, res) => {
    res.render('home', { loggedin: req.session.loggedin, email: req.session.email });
  });

  app.get('/about', (req, res) => {
    res.render('about', { loggedin: req.session.loggedin, email: req.session.email });
  });

  app.get('/blog', (req, res) => {
    res.render('blog', { loggedin: req.session.loggedin, email: req.session.email });
  });

  app.get('/contact', (req, res) => {
    res.render('contact', { loggedin: req.session.loggedin, email: req.session.email });
  });

  // CRUD Operations for Tests
  // Read all tests
  app.get('/services', (req, res) => {
    if (!req.session.loggedin) {
      req.session.error = 'Please login first';
      return res.redirect('/login');
    }

    db.query('SELECT * FROM tests', (err, tests) => {
      if (err) {
        console.error('Error fetching tests:', err);
        return res.status(500).render('error', { 
          message: 'Error loading services',
          loggedin: req.session.loggedin,
          email: req.session.email
        });
      }
      res.render('services', { 
        tests: tests,
        loggedin: req.session.loggedin,
        email: req.session.email,
        success: res.locals.success,
        error: res.locals.error
      });
    });
  });

  // Create test - Form
  app.get('/tests/new', (req, res) => {
    if (!req.session.loggedin || req.session.email !== 'admin@example.com') {
      req.session.error = 'Admin access required';
      return res.redirect('/services');
    }
    res.render('test-form', { 
      test: null,
      loggedin: req.session.loggedin,
      email: req.session.email 
    });
  });

  // Create test - Process
  app.post('/tests', (req, res) => {
    if (!req.session.loggedin || req.session.email !== 'admin@example.com') {
      req.session.error = 'Admin access required';
      return res.redirect('/services');
    }

    const { name, description, price, duration, preparation } = req.body;
    
    db.query(
      'INSERT INTO tests (name, description, price, duration, preparation) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, duration, preparation],
      (err) => {
        if (err) {
          console.error('Error creating test:', err);
          req.session.error = 'Failed to create test';
          return res.redirect('/tests/new');
        }
        req.session.success = 'Test created successfully!';
        res.redirect('/services');
      }
    );
  });

  // Update test - Form
  app.get('/tests/:id/edit', (req, res) => {
    if (!req.session.loggedin || req.session.email !== 'admin@example.com') {
      req.session.error = 'Admin access required';
      return res.redirect('/services');
    }

    db.query('SELECT * FROM tests WHERE id = ?', [req.params.id], (err, results) => {
      if (err || results.length === 0) {
        req.session.error = 'Test not found';
        return res.redirect('/services');
      }
      res.render('test-form', { 
        test: results[0],
        loggedin: req.session.loggedin,
        email: req.session.email 
      });
    });
  });

  // Update test - Process
  app.post('/tests/:id', (req, res) => {
    if (!req.session.loggedin || req.session.email !== 'admin@example.com') {
      req.session.error = 'Admin access required';
      return res.redirect('/services');
    }

    const { name, description, price, duration, preparation } = req.body;
    
    db.query(
      'UPDATE tests SET name = ?, description = ?, price = ?, duration = ?, preparation = ? WHERE id = ?',
      [name, description, price, duration, preparation, req.params.id],
      (err) => {
        if (err) {
          console.error('Error updating test:', err);
          req.session.error = 'Failed to update test';
          return res.redirect(`/tests/${req.params.id}/edit`);
        }
        req.session.success = 'Test updated successfully!';
        res.redirect('/services');
      }
    );
  });

  // Delete test
  app.post('/tests/:id/delete', (req, res) => {
    if (!req.session.loggedin || req.session.email !== 'admin@example.com') {
      req.session.error = 'Admin access required';
      return res.redirect('/services');
    }

    db.query('DELETE FROM tests WHERE id = ?', [req.params.id], (err) => {
      if (err) {
        console.error('Error deleting test:', err);
        req.session.error = 'Failed to delete test';
      } else {
        req.session.success = 'Test deleted successfully!';
      }
      res.redirect('/services');
    });
  });

  // CRUD Operations for Bookings
  // Read all bookings (admin view)
  app.get('/bookings', (req, res) => {
    if (!req.session.loggedin) {
      req.session.error = 'Please login first';
      return res.redirect('/login');
    }

    let query = 'SELECT b.*, u.name as user_name FROM bookings b JOIN users u ON b.user_id = u.id';
    let params = [];
    
    // Regular users can only see their own bookings
    if (req.session.email !== 'admin@example.com') {
      query += ' WHERE b.user_id = ?';
      params.push(req.session.userId);
    }

    query += ' ORDER BY b.booking_date DESC';

    db.query(query, params, (err, bookings) => {
      if (err) {
        console.error('Error fetching bookings:', err);
        return res.status(500).render('error', {
          message: 'Error loading bookings',
          loggedin: req.session.loggedin,
          email: req.session.email
        });
      }
      res.render('bookings', {
        bookings: bookings,
        loggedin: req.session.loggedin,
        email: req.session.email,
        isAdmin: req.session.email === 'admin@example.com'
      });
    });
  });
// View single booking details
app.get('/bookings/:id', (req, res) => {
  if (!req.session.loggedin) {
    req.session.error = 'Please login first';
    return res.redirect('/login');
  }

  const bookingId = req.params.id;
  
  db.query(`
    SELECT b.*, t.description, t.preparation, u.name as user_name 
    FROM bookings b
    JOIN tests t ON b.test_id = t.id
    JOIN users u ON b.user_id = u.id
    WHERE b.id = ?
  `, [bookingId], (err, results) => {
    if (err || results.length === 0) {
      req.session.error = 'Booking not found';
      return res.redirect('/bookings');
    }

    const booking = results[0];
    
    // Verify ownership (user or admin)
    if (req.session.email !== 'admin@example.com' && booking.user_id !== req.session.userId) {
      req.session.error = 'Unauthorized access';
      return res.redirect('/bookings');
    }

    res.render('booking-details', {
      booking: booking,
      loggedin: req.session.loggedin,
      email: req.session.email,
      isAdmin: req.session.email === 'admin@example.com'
    });
  });
});

  // Update booking status (admin only)
  app.post('/bookings/:id/status', (req, res) => {
    if (!req.session.loggedin || req.session.email !== 'admin@example.com') {
      req.session.error = 'Admin access required';
      return res.redirect('/bookings');
    }

    const { status } = req.body;
    db.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, req.params.id],
      (err) => {
        if (err) {
          console.error('Error updating booking status:', err);
          req.session.error = 'Failed to update booking status';
        } else {
          req.session.success = 'Booking status updated!';
        }
        res.redirect('/bookings');
      }
    );
  });

  // Delete booking
  app.post('/bookings/:id/delete', (req, res) => {
    if (!req.session.loggedin) {
      req.session.error = 'Please login first';
      return res.redirect('/login');
    }

    let query = 'DELETE FROM bookings WHERE id = ?';
    let params = [req.params.id];
    
    // Regular users can only delete their own bookings
    if (req.session.email !== 'admin@example.com') {
      query += ' AND user_id = ?';
      params.push(req.session.userId);
    }

    db.query(query, params, (err) => {
      if (err) {
        console.error('Error deleting booking:', err);
        req.session.error = 'Failed to delete booking';
      } else {
        req.session.success = 'Booking deleted successfully!';
      }
      res.redirect('/bookings');
    });
  });

  app.get('/bookings/:id/edit', (req, res) => {
    if (!req.session.loggedin) {
      req.session.error = 'Please login first';
      return res.redirect('/login');
    }

    const bookingId = req.params.id;
    
    db.query('SELECT * FROM bookings WHERE id = ?', [bookingId], (err, results) => {
      if (err || results.length === 0) {
        req.session.error = 'Booking not found';
        return res.redirect('/bookings');
      }

      if (req.session.email !== 'admin@example.com' && results[0].user_id !== req.session.userId) {
        req.session.error = 'Unauthorized access';
        return res.redirect('/bookings');
      }

      db.query('SELECT * FROM tests', (err, tests) => {
        if (err) {
          console.error('Error fetching tests:', err);
          req.session.error = 'Error loading form';
          return res.redirect('/bookings');
        }

        res.render('edit-booking', {
          booking: results[0],
          tests,
          loggedin: req.session.loggedin,
          email: req.session.email
        });
      });
    });
  });

// Admin: Upload test results
app.get('/bookings/:id/results', (req, res) => {
  if (!req.session.loggedin || req.session.email !== 'admin@example.com') {
    req.session.error = 'Admin access required';
    return res.redirect('/bookings');
  }

  db.query('SELECT * FROM bookings WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) {
      req.session.error = 'Booking not found';
      return res.redirect('/bookings');
    }

    res.render('upload-results', {
      booking: results[0],
      loggedin: req.session.loggedin,
      email: req.session.email
    });
  });
});

// Admin: Save uploaded test results
app.post('/bookings/:id/results', (req, res) => {
  if (!req.session.loggedin || req.session.email !== 'admin@example.com') {
    req.session.error = 'Admin access required';
    return res.redirect('/bookings');
  }

  const { results } = req.body;
  
  db.query(
    'UPDATE bookings SET results = ?, results_date = NOW(), status = "Completed" WHERE id = ?',
    [results, req.params.id],
    (err) => {
      if (err) {
        console.error('Error saving results:', err);
        req.session.error = 'Failed to save results';
        return res.redirect(`/bookings/${req.params.id}/results`);
      }
      req.session.success = 'Results uploaded successfully!';
      res.redirect(`/bookings/${req.params.id}`);
    }
  );
});

// View test results
app.get('/bookings/:id/results/view', (req, res) => {
  if (!req.session.loggedin) {
    req.session.error = 'Please login first';
    return res.redirect('/login');
  }

  db.query('SELECT * FROM bookings WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) {
      req.session.error = 'Booking not found';
      return res.redirect('/bookings');
    }

    const booking = results[0];
    
    if (req.session.email !== 'admin@example.com' && booking.user_id !== req.session.userId) {
      req.session.error = 'Unauthorized access';
      return res.redirect('/bookings');
    }

    if (!booking.results) {
      req.session.error = 'Results not available yet';
      return res.redirect(`/bookings/${booking.id}`);
    }

    res.render('view-results', {
      booking: booking,
      loggedin: req.session.loggedin,
      email: req.session.email
    });
  });
});


// Update booking - Process (PUT route)
app.put('/bookings/:id', (req, res) => {
  if (!req.session.loggedin) {
    req.session.error = 'Please login first';
    return res.redirect('/login');
  }

  const bookingId = req.params.id;
  const { test_id, patient_name, age, gender, address, phone, email, booking_date, additional_notes } = req.body;

  db.query('SELECT * FROM bookings WHERE id = ?', [bookingId], (err, results) => {
    if (err || results.length === 0) {
      req.session.error = 'Booking not found';
      return res.redirect('/bookings');
    }

    if (req.session.email !== 'admin@example.com' && results[0].user_id !== req.session.userId) {
      req.session.error = 'Unauthorized access';
      return res.redirect('/bookings');
    }

    db.query('SELECT name FROM tests WHERE id = ?', [test_id], (err, testResults) => {
      if (err || testResults.length === 0) {
        req.session.error = 'Invalid test selected';
        return res.redirect(`/bookings/${bookingId}/edit`);
      }

      db.query(
        `UPDATE bookings SET 
          test_id = ?, 
          test_name = ?,
          patient_name = ?,
          age = ?,
          gender = ?,
          address = ?,
          phone = ?,
          email = ?,
          booking_date = ?,
          additional_notes = ?
        WHERE id = ?`,
        [
          test_id,
          testResults[0].name,
          patient_name,
          age,
          gender,
          address,
          phone,
          email,
          booking_date,
          additional_notes || null,
          bookingId
        ],
        (err) => {
          if (err) {
            console.error('Update error:', err);
            req.session.error = 'Failed to update booking';
            return res.redirect(`/bookings/${bookingId}/edit`);
          }
          req.session.success = 'Booking updated successfully!';
          res.redirect('/bookings');
        }
      );
    });
  });
});

  // User authentication routes
  app.get('/login', (req, res) => {
    if (req.session.loggedin) return res.redirect('/services');
    res.render('login', { error: res.locals.error, loggedin: false });
  });

  app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      req.session.error = 'Please enter both email and password';
      return res.redirect('/login');
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        req.session.error = 'Database error occurred';
        return res.redirect('/login');
      }

      if (results.length === 0) {
        req.session.error = 'Email not found!';
        return res.redirect('/login');
      }

      bcrypt.compare(password, results[0].password, (err, result) => {
        if (err) {
          console.error('Bcrypt error:', err);
          req.session.error = 'Authentication error';
          return res.redirect('/login');
        }

        if (result) {
          req.session.loggedin = true;
          req.session.userId = results[0].id;
          req.session.email = email;
          req.session.success = 'Logged in successfully!';
          return res.redirect('/services');
        } else {
          req.session.error = 'Incorrect password!';
          return res.redirect('/login');
        }
      });
    });
  });

  app.get('/register', (req, res) => {
    if (req.session.loggedin) return res.redirect('/services');
    res.render('register', { error: res.locals.error, loggedin: false });
  });

  app.post('/register', (req, res) => {
    const { name, email, password, confirmPassword, phone } = req.body;
    
    if (!name || !email || !password || !confirmPassword || !phone) {
      req.session.error = 'All fields are required';
      return res.redirect('/register');
    }

    if (password !== confirmPassword) {
      req.session.error = 'Passwords do not match';
      return res.redirect('/register');
    }

    if (password.length < 6) {
      req.session.error = 'Password must be at least 6 characters';
      return res.redirect('/register');
    }

    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        console.error('Bcrypt error:', err);
        req.session.error = 'Error processing password';
        return res.redirect('/register');
      }

      db.query(
        'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
        [name, email, hash, phone],
        (err, results) => {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              req.session.error = 'Email already exists!';
            } else {
              console.error('Database error:', err);
              req.session.error = 'Registration failed';
            }
            return res.redirect('/register');
          }

          req.session.loggedin = true;
          req.session.userId = results.insertId;
          req.session.email = email;
          req.session.success = 'Registration successful!';
          res.redirect('/services');
        }
      );
    });
  });

  app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
  });

  // Booking routes
  app.get('/book-test/:testId', (req, res) => {
    if (!req.session.loggedin) {
      req.session.error = 'Please login first';
      return res.redirect('/login');
    }

    const testId = req.params.testId;
    db.query('SELECT * FROM tests WHERE id = ?', [testId], (err, results) => {
      if (err) {
        console.error('Error fetching test:', err);
        return res.status(500).render('error', { 
          message: 'Error loading test',
          loggedin: req.session.loggedin,
          email: req.session.email
        });
      }

      if (results.length === 0) {
        return res.status(404).render('error', { 
          message: 'Test not found',
          loggedin: req.session.loggedin,
          email: req.session.email
        });
      }

      res.render('booking-form', { 
        test: results[0],
        loggedin: req.session.loggedin,
        email: req.session.email,
        error: res.locals.error
      });
    });
  });

  app.post('/submit-booking', (req, res) => {
    if (!req.session.loggedin) {
      req.session.error = 'Please login first';
      return res.redirect('/login');
    }

    const { test_id, test_name, patient_name, age, gender, address, phone, email, booking_date, additional_notes } = req.body;
    
    // Basic validation
    if (!test_id || !patient_name || !age || !gender || !address || !phone || !email || !booking_date) {
      req.session.error = 'Please fill all required fields';
      return res.redirect(`/book-test/${test_id}`);
    }

    db.query(
      `INSERT INTO bookings 
      (user_id, test_id, test_name, patient_name, age, gender, address, phone, email, booking_date, additional_notes, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.session.userId, 
        test_id, 
        test_name, 
        patient_name, 
        age, 
        gender, 
        address, 
        phone, 
        email, 
        booking_date, 
        additional_notes || null, 
        'Pending'
      ],
      (err) => {
        if (err) {
          console.error('Booking error:', err);
          req.session.error = 'Booking failed. Please try again.';
          return res.redirect(`/book-test/${test_id}`);
        }

        req.session.success = 'Test booked successfully!';
        res.redirect('/bookings');
      }
    );
  });

  // Error handling
  app.use((req, res) => {
    res.status(404).render('error', {
      message: 'Page not found',
      loggedin: req.session.loggedin,
      email: req.session.email
    });
  });

  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).render('error', {
      message: 'Something went wrong!',
      loggedin: req.session.loggedin,
      email: req.session.email
    });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
