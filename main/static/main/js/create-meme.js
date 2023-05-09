const loadCreateMeme = () => {
    loadDefaultMemes();
}


// Load default meme options
const loadDefaultMemes = async () => {

    // Gather default templates
    const apiRequest = new GeneralAPIRequest("DefaultTemplate", {
        customSerializer: true
    });
    const response = await apiRequest.send();
    const templates = response.data.data;

    // Create template elements
    const templateEls = templates.map(template => {
        return `<a class="default-template-select" data-src="${template.image}" data-template_slug="${template.slug_name}"><img src="${template.image}"></a>`
    });

    // Load templates
    $('#default-templates').html(templateEls.join(''));
    $(`.default-template-select[data-template_slug="${templates[0].slug_name}"]`).addClass('selected');

    // Load preview
    loadMemePreview();
}


const loadMemePreview = async () => {

    // Set selected template in preview
    const selectedTemplate = $('.default-template-select.selected');
    const src = selectedTemplate.data('src');
    if (!src) {
        return;
    }
    $('#create-meme-form input[name="template_slug"]').val(selectedTemplate.data('template_slug'));

    // Determine font size for bottom and top text relative to image size
    const memeImage = $('#memeImage');
    memeImage.attr('src', src);

    const memeTextTop = $('#memeTextTop');
    const memeTextBottom = $('#memeTextBottom');
    const scaleFactor = memeImage.width() / memeImage[0].naturalWidth;

    let fontSize = memeImage[0].naturalHeight * 0.1 * scaleFactor;
    fontSize = fontSize < 6 ? 6 : fontSize;
    memeTextTop.css('font-size', fontSize + 'px');
    memeTextBottom.css('font-size', fontSize + 'px');

    // Set top text and bottom text using values from create meme form
    const formData = getFormData('create-meme-form');
    memeTextTop.text(formData.top_text.toUpperCase());
    memeTextBottom.text(formData.bottom_text.toUpperCase());

}

// Upload meme
const uploadMeme = async () => {

    // Gather form data
    const data = getFormData('create-meme-form');

    // Post meme and load view meme page if all goes well
    const response = await sendPost('/upload-meme/', data);
    if (response.ok) {
        window.LOAD_SECTION('view-meme', {
            meme_uuid: response.data.meme_uuid
        })
        return;
    }
}


$(document).ready(function() {

    // Handle selection of different template
    $(document).on('click', '.default-template-select', async function() {
        $('.default-template-select').removeClass('selected');
        const el = $(this);
        el.addClass('selected');
        loadMemePreview();
    })

    // Update preview on any sort of input
    $('#create-meme-form input').on('input', async function() {
        loadMemePreview();
    })

    // Handle meme submission
    $('#create-meme-form').on('submit', async function(event) {
        event.preventDefault();
        const submitButton = $('#create-meme-form button[type="submit"]')
        submitButton.addClass('is-loading');
        await uploadMeme();
        submitButton.removeClass('is-loading');
    })
})