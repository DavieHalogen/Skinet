const mysql = require('mysql2');

// Create a connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'SkinetDatabase',
    password: '7729428',
});

// Use the promise-based API
const promisePool = pool.promise();

// Create the Users table if it doesn't exist
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        package VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'inactive',
        mobileNumber VARCHAR(50),
        photoUrl VARCHAR(225),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
`;

// Create the table
async function createTable() {
    try {
        await promisePool.query(createTableQuery);
        console.log('Users table created or already exists.');
    } catch (err) {
        console.error('Error creating table:', err);
    }
}

// Connect to the database and create the table
createTable();

module.exports = promisePool;