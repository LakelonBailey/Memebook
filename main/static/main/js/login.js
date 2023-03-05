
const addErrorText = (field, text='Required Field!') => {
    field.addClass('is-danger').closest('.field').find('.help').removeClass('is-invisible').text(text);
}

const tryLogin = async () => {
    const formData = getFormData('login-form');
    const response = await sendPost('/login/', formData);
    const result = response.data;
    console.log(result);
    if (!result.success) {
        await swalNotif.fire({
            icon: 'error',
            title: 'Login Failed',
            text: result.reason
        })
        return;
    }

    window.location.replace('/');
}

(function($) {
$(document).ready(function() {
    $('#login-form').on('submit', function(event) {
        event.preventDefault();
        tryLogin();
    })
});
})(jQuery)