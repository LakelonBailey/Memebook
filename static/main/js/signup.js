
const addErrorText = (field, text='Required Field!') => {
    field.addClass('is-danger').closest('.field').find('.help').removeClass('is-invisible').text(text);
}

const trySignup = async () => {
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

    if (!isEmail(formData.email)) {
        addErrorText($('#signup-form input[name="email"]'), 'Please enter a valid email!');
        return;
    }

    if (formData.password.length < 10) {
        addErrorText($('#signup-form input[name="password"]'), 'Password must be at least 10 characters!');
        return;
    }

    if (formData.password != formData.confirm_password) {
        addErrorText($('#signup-form input[name="confirm_password"]'), 'Passwords do not match!');
        return;
    }

    delete formData.confirm_password;
    const response = await sendPost('/signup/', formData);
    const result = response.data;
    console.log(result);
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

(function($) {
$(document).ready(function() {
    $('#signup-form').on('submit', function(event) {
        event.preventDefault();
        trySignup();
    })

    $('#signup-form input').on('focus', function() {
        $(this)
        .removeClass('is-danger')
        .closest('.field')
        .find('.help')
        .addClass('is-invisible');
    })
});
})(jQuery)