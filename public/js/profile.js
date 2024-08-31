//handles profile form display and updates
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/profile');
        const profile = await response.json();

        // Populate the form fields with the user's profile data
        document.getElementById('name').value = profile.name;
        document.getElementById('email').value = profile.email;
        document.getElementById('mobile-number').value = profile.mobileNumber;
        document.getElementById('package').value = profile.package;
        
        
       const profileImage = document.getElementById('profile-image');
        if (profile.photoUrl) {
          profileImage.src = profile.photoUrl
     }  else{
          profileImage.src = '/images/empty-profile.png';
     }
        

    } catch (error) {
        console.error('Error fetching profile:', error);
        alert('Error fetching profile. Please try again.')
        document.getElementById('profile-image').src = '/images/empty-profile.png';
    }
});


document.getElementById('profile-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        mobileNumber: document.getElementById('mobile-number').value,
        package: document.getElementById('package').value
    };

    try {
        const response = await fetch('/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        if (result.success) {
            alert('Profile updated successfully!');
        } else {
            alert('Error updating profile: ' + result.error);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile. Please try again.');
    }
});

//password-form
document.getElementById('password-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }

    try {
        const response = await fetch('/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const result = await response.json();
        if (result.success) {
            alert('Password changed successfully!');
        } else {
            alert('Error changing password: ' + result.error);
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Error changing password. Please try again.');
    }
});

//photo-form
document.getElementById('photo-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData();
    const fileInput = document.getElementById('profile-photo-input');
    formData.append('profile-photo', fileInput.files[0]);

    try {
        const response = await fetch('/upload-profile-photo', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            document.getElementById('profile-image').src = result.photoUrl;
            alert('Profile photo uploaded successfully!');
        } else {
            alert('Error uploading photo: ' + result.error);
        }
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        alert('Error uploading profile photo. Please try again.');
    }
});