        // Get package from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const package = urlParams.get('package');
        const price = urlParams.get('price');
        document.getElementById('package').value = package;

        // Handle login form submission
        document.getElementById('loginForm').addEventListener('submit', function(event) {
            event.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })
            .then(response => {
                if (response.ok) {
                    // Redirect to payment.html upon successful login
                    window.location.href = `/payment.html?package=${encodeURIComponent(package)}&price=${encodeURIComponent(price)}`;
                } else {
                    return response.text().then(text => {
                        // Display error message from server
                        alert(text);
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An unexpected error occurred. Please try again.');
            });
        });

        // Handle signup form submission
        document.getElementById('signupForm').addEventListener('submit', function(event) {
            event.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            if (password.length < 6) {
                alert('Password must be at least 6 characters long.');
                return;
            }

            fetch('/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, package }),
            })
            .then(response => {
                if (response.ok) {
                    // Redirect to payment.html upon successful signup
                    window.location.href = `/payment.html?package=${encodeURIComponent(package)}&price=${encodeURIComponent(price)}`;
                } else {
                    return response.text().then(text => {
                        // Display error message from server
                        alert(text);
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An unexpected error occurred. Please try again.');
            });
        });