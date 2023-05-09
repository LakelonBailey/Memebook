// Add error text to input element
const addErrorText = (field, text='Required Field!') => {
    field.addClass('is-danger').closest('.field').find('.help').removeClass('is-invisible').text(text);
}

// Attempt login
const tryLogin = async () => {
    // Gather form data
    const formData = getFormData('login-form');

    // Post login info
    const response = await sendPost('/login/', formData);

    // Handle different results
    const result = response.data;
    if (!result.success) {
        await swalNotif.fire({
            icon: 'error',
            title: 'Login Failed',
            text: result.reason
        })
        return;
    }

    // Redirect to next page
    localStorage.setItem('section', 'feed');
    const urlParams = new URLSearchParams(window.location.search);
    const next = urlParams.get('next');

    if (next != undefined && next != null) {
        window.location.replace(next);
        return;
    }
    window.location.replace('/');
}

$(document).ready(function() {

    // Wait for submission
    $('#login-form').on('submit', function(event) {
        event.preventDefault();
        tryLogin();
    })
});