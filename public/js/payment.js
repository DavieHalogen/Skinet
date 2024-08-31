document.addEventListener('DOMContentLoaded', async () => {
    // Get package and price from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlPackage = urlParams.get('package');
    const urlPrice = urlParams.get('price');

    if (urlPackage && urlPrice) {
        // Use URL parameters if they exist
        document.getElementById('package-name').textContent = urlPackage;
        document.getElementById('package-price').textContent = urlPrice;
    } else {
        // Fetch profile data if URL parameters are not present
        try {
            const profileResponse = await fetch('/profile');
            const profile = await profileResponse.json();

            // Display the package and price from profile
            const packageName = profile.package;
            const priceMap = {
                'Hourly Package': 20,
                'Daily Package': 50,
                'Two-Day Package': 80,
                'Weekly Package': 200,
                'Monthly Package': 500,
                'Family Package': 800
            };

            const packagePrice = priceMap[packageName] || 'Unknown';

            document.getElementById('package-name').textContent = packageName;
            document.getElementById('package-price').textContent = packagePrice;


        } catch (error) {
            console.error('Error fetching profile:', error);
            alert('Error fetching profile. Please try again.');
        }
    }
});

function selectPackage(packageName, packagePrice) {
    document.getElementById('package-name').textContent = packageName;
    document.getElementById('package-price').textContent = packagePrice;
}


document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/profile');
        const profile = await response.json();

        // Set the profile photo icon
        const profileIcon = document.getElementById('profile-icon');
        if (profile.photoUrl) {
          profileIcon.src = profile.photoUrl;
      } else {
        profileIcon.src = '/images/empty-profile.png';
      }

    } catch (error) {
        console.error('Error fetching profile photo:', error);
        // Set a default photo or handle errors as needed
        document.getElementById('profile-icon').src = '/images/empty-profile.png';
    }
});

function payWithMpesa() {
    const packageName = document.getElementById('package-name').textContent;
    const packagePrice = document.getElementById('package-price').textContent;
    const mobileNumber = document.getElementById('mobile-number').value;
    const fullMobileNumber = `+254${mobileNumber}`;

    if (mobileNumber === '' || !/^\d{9}$/.test(mobileNumber)) {
        alert('Please enter a valid mobile number.');
        return;
    }

    const data = {
        mobileNumber: fullMobileNumber,
        package: packageName,
        price: packagePrice
    };

    // Send the payment data to the server
    fetch('/process-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Payment request sent. Please complete the payment on your phone.');
        } else {
            alert('Payment request failed: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while processing the payment.');
    });
}
