const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const pool = require('./mariadb');  // Import the promise-based pool
const { stkPush } = require('./mpesa');

const app = express();
const saltRounds = 10; // Adjust as needed

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
    secret: 'your-secret-key',  // Replace with a strong secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set to true if using HTTPS
}));

function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/combined');
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});


app.get('/payment', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'payment.html'));
});

app.get('/combined', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'combined.html'));
});

app.post('/signup', async (req, res) => {
    const { name, email, password, package } = req.body;
   
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert a new user
        await pool.query('INSERT INTO Users (name, email, package, password) VALUES (?, ?, ?, ?)', [name, email, package, hashedPassword]);
        
        res.redirect('/payment');
    } catch (error) {
        console.error('Error during signup:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            // Handle duplicate entry error
            if (error.sqlMessage.includes('name')) {
                return res.status(400).send('Name is already taken.' );
            } else if (error.sqlMessage.includes('email')) {
                return res.status(400).send('Email is already registered.' );
            }
        }
        res.status(500).send('Error signing up. Please try again.' );
    }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const [rows] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (rows.length > 0) {
            const user = rows[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                // Save user ID in session
                req.session.userId = user.id;
                res.redirect('/profile');
            } else {
                res.status(401).send('Incorrect password');
            }
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Error logging in. Please try again.');
    }
});

app.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Users WHERE id = ?', [req.session.userId]);
        if (rows.length > 0) {
            res.json(rows[0]);  // Send the user profile data as JSON
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error retrieving profile:', error);
        res.status(500).send('Error retrieving profile. Please try again.');
    }
});

app.post('/update-profile', isAuthenticated, async (req, res) => {
    const { name, email, mobileNumber, package } = req.body;
    const userId = req.session.userId;

    try {
        // Update the user's profile
        await pool.query('UPDATE Users SET name = ?, email = ?, mobileNumber = ?, package = ? WHERE id = ?', 
                         [name, email, mobileNumber, package, userId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, error: 'Error updating profile. Please try again.' });
    }
});

app.post('/change-password', isAuthenticated, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.userId;

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
    }

    try {
        // Fetch the user's current password hash
        const [rows] = await pool.query('SELECT password FROM Users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(currentPassword, user.password);

        if (!match) {
            return res.status(401).json({ success: false, error: 'Current password is incorrect' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update the password in the database
        await pool.query('UPDATE Users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, error: 'Error changing password. Please try again.' });
    }
});

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/images/profiles');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const fileName = `${req.session.userId}${ext}`;
        cb(null, fileName);
    }
});
const upload = multer({ storage: storage });

app.post('/upload-profile-photo', isAuthenticated, upload.single('profile-photo'), async (req, res) => {
    const photoPath = `/images/profiles/${req.file.filename}`;
    const userId = req.session.userId;

    try {
        // Update the user's profile photo in the database
        await pool.query('UPDATE Users SET photoUrl = ? WHERE id = ?', [photoPath, userId]);
        res.json({ success: true, photoUrl: photoPath });
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        res.status(500).json({ success: false, error: 'Error uploading profile photo. Please try again.' });
    }
});

app.get('/payment', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Users WHERE id = ?', [req.session.userId]);
        if (rows.length > 0) {
            res.sendFile(path.join(__dirname, '../public', 'payment.html'));
            console.log('GET /payment - Sent payment.html');
        } else {
            res.redirect('/combined');  // Redirect to another page if user not found
        }
    } catch (error) {
        console.error('Error fetching user for /payment:', error);
        res.status(500).send('Error retrieving user. Please try again.');
    }
});


app.post('/process-payment', isAuthenticated, async (req, res) => {
    const { mobileNumber, package, price } = req.body;

    try {
        // Placeholder for payment processing logic
        const response = await stkPush(mobileNumber, price);
        if (response.ResponseCode === '0') {
            res.json({ success: true, mobileNumber });
            console.log(`POST /process-payment - Payment request sent: ${mobileNumber}, ${package}, ${price}`);
        } else {
            res.json({ success: false, error: response.ResponseDescription });
            console.error(`POST /process-payment - Payment request failed: ${response.ResponseDescription}`);
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ success: false, error: 'Error processing payment. Please try again.' });
    }
});

app.post('/confirm-payment', isAuthenticated, async (req, res) => {
    const { mobileNumber } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM Users WHERE mobileNumber = ?', [mobileNumber]);
        if (rows.length > 0) {
            await pool.query('UPDATE Users SET status = ? WHERE mobileNumber = ?', ['active', mobileNumber]);
            res.json({ success: true });
            console.log(`POST /confirm-payment - Payment confirmed: ${mobileNumber}`);
        } else {
            res.status(404).json({ success: false, error: 'User not found' });
            console.error(`POST /confirm-payment - User not found: ${mobileNumber}`);
        }
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ success: false, error: 'Error confirming payment. Please try again.' });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error logging out. Please try again.');
        }
        res.redirect('/');
    });
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
