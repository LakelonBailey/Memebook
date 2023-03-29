
const addErrorText = (field, text='Required Field!') => {
    field.addClass('is-danger').closest('.field').find('.help').removeClass('is-invisible').text(text);
}

const tryLogin = async () => {
    const formData = getFormData('login-form');
    const response = await sendPost('/login/', formData);
    const result = response.data;

    if (!result.success) {
        await swalNotif.fire({
            icon: 'error',
            title: 'Login Failed',
            text: result.reason
        })
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const next = urlParams.get('next');

    if (next != undefined && next != null) {
        window.location.replace(next);
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