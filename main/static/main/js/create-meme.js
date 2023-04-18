const loadDefaultMemes = async () => {
    const apiRequest = new GeneralAPIRequest("DefaultTemplate", {
        customSerializer: true
    })

    const response = await apiRequest.send();
    const templates = response.data.data;
    const templateEls = templates.map(template => {
        return `<a class="default-template-select" data-src="${template.image}" data-template_slug="${template.slug_name}"><img src="${template.image}"></a>`
    });
    $('#default-templates').html(templateEls.join(''));
    $(`.default-template-select[data-template_slug="${templates[0].slug_name}"]`).addClass('selected');
    loadMemePreview();
}


const loadCreateMeme = () => {
    loadDefaultMemes();
}

const loadMemePreview = async () => {
    const selectedTemplate = $('.default-template-select.selected');
    const src = selectedTemplate.data('src');
    if (!src) {
        return;
    }
    $('#create-meme-form input[name="template_slug"]').val(selectedTemplate.data('template_slug'));
    const memeImage = document.getElementById('memeImage');
    memeImage.src = src;

    const memeTextTop = document.getElementById('memeTextTop');
    const memeTextBottom = document.getElementById('memeTextBottom');
    const scaleFactor = memeImage.clientWidth / memeImage.naturalWidth;

    let fontSize = memeImage.naturalHeight * 0.1 * scaleFactor;
    fontSize = fontSize < 6 ? 6 : fontSize;
    memeTextTop.style.fontSize = fontSize + 'px';
    memeTextBottom.style.fontSize = fontSize + 'px';

    const formData = getFormData('create-meme-form');
    memeTextTop.textContent = formData.top_text.toUpperCase();
    memeTextBottom.textContent = formData.bottom_text.toUpperCase();
}

const uploadMeme = async () => {
    const data = getFormData('create-meme-form');
    const response = await sendPost('/upload-meme/', data);
    if (response.ok) {
        window.LOAD_SECTION('view-meme', {
            meme_uuid: response.data.meme_uuid
        })
        return;
    }
}


$(document).ready(function() {
    $(document).on('click', '.default-template-select', async function() {
        $('.default-template-select').removeClass('selected');
        const el = $(this);
        el.addClass('selected');
        loadMemePreview();
    })

    $('#create-meme-form input').on('input', async function() {
        loadMemePreview();
    })

    $('#create-meme-form').on('submit', async function(event) {
        event.preventDefault();
        const submitButton = $('#create-meme-form button[type="submit"]')
        submitButton.addClass('is-loading');
        await uploadMeme();
        submitButton.removeClass('is-loading');
    })
})