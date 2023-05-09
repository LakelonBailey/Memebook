const addErrorText = (field, text='Required Field!') => {
    // Add the 'is-danger' class to the field and show the error text
    field.addClass('is-danger').closest('.field').find('.help').removeClass('is-invisible').text(text);
}

const trySignup = async () => {
    // Get the form data and check for invalid fields
    const formData = getFormData('signup-form');
    let invalidExists = false;
    for (let [name, val] of Object.entries(formData)) {
        if (!val) {
            addErrorText($(`#signup-form input[name="${name}"]`))
            invalidExists = true;
        }
    }
    if (invalidExists) {
        return;
    }

    // Check for valid email format
    if (!isEmail(formData.email)) {
        addErrorText($('#signup-form input[name="email"]'), 'Please enter a valid email!');
        return;
    }

    // Check for valid password length and matching passwords
    if (formData.password.length < 10) {
        addErrorText($('#signup-form input[name="password"]'), 'Password must be at least 10 characters!');
        return;
    }

    if (formData.password != formData.confirm_password) {
        addErrorText($('#signup-form input[name="confirm_password"]'), 'Passwords do not match!');
        return;
    }

    // Remove the confirm_password field and send a POST request to sign up the user
    delete formData.confirm_password;
    const response = await sendPost('/signup/', formData);
    const result = response.data;

    // Show an error notification if the signup failed, otherwise redirect to the home page
    if (!result.success) {
        await swalNotif.fire({
            icon: 'error',
            title: 'Account Creation Failed',
            text: result.reason
        })
        return;
    }

    window.location.replace('/');
}


$(document).ready(function() {
    // Add event listeners for the signup form fields
    $('#signup-form').on('submit', function(event) {
        event.preventDefault();
        trySignup();
    })

    $('#signup-form input').on('focus', function() {
        // Remove the 'is-danger' class and hide the error text when the field is focused
        $(this)
        .removeClass('is-danger')
        .closest('.field')
        .find('.help')
        .addClass('is-invisible');
    })
});
