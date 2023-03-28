const loadDefaultMemes = async () => {
    const apiRequest = new GeneralAPIRequest("DefaultTemplate", {
        customSerializer: true
    })

    const response = await apiRequest.send();
    const templates = response.data.data;
    const templateEls = templates.map(template => {
        return `<a class="default-template-select" data-src="${template.image}"><img src="${template.image}"></a>`
    });

    $('#default-templates').html(templateEls.join(''));
}


const loadCreateMeme = () => {
    loadDefaultMemes();
}

const createCanvas = async (topText, bottomText, imageLink) => {
    // create a new HTML image element
    const image = new Image();

    // create a canvas element
    const canvas = document.createElement('canvas');

    // create a 2D context for the canvas
    const ctx = canvas.getContext('2d');

    // load the image from the link into the image element
    image.src = imageLink;

    // set the canvas dimensions to match the image dimensions
    await new Promise(resolve => {
      image.onload = function() {
          canvas.width = image.width;
          canvas.height = image.height;
          resolve();
      };
    });

    // calculate the size of the image element on the screen
    const imgElement = document.createElement('img');
    imgElement.src = imageLink;
    imgElement.style.position = 'absolute';
    imgElement.style.top = '-9999px';
    imgElement.style.left = '-9999px';
    document.body.appendChild(imgElement);
    const imgElementWidth = imgElement.offsetWidth;
    const imgElementHeight = imgElement.offsetHeight;
    document.body.removeChild(imgElement);

    // Draw the image onto the canvas
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Set styling
    const fontSize = Math.floor(imgElementHeight / 10); // set font size relative to image height
    ctx.font = `bold ${fontSize}px impact`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.textTransform = 'uppercase';
    ctx.letterSpacing = '1px';
    ctx.shadowColor = '#000';
    ctx.shadowOffsetX = '2px';
    ctx.shadowOffsetY = '2px';
    ctx.shadowBlur = '5px';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'black';


    topText = topText ? topText : 'Top Text';
    bottomText = bottomText ? bottomText : 'Bottom Text';

    // Add top text
    ctx.strokeText(topText.toUpperCase(), canvas.width / 2, fontSize / 2);
    ctx.fillText(topText.toUpperCase(), canvas.width / 2, fontSize / 2);

    // Add bottom text
    ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - fontSize);
    ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - fontSize);

    return canvas;
};



const showCanvas = canvas => {
    // Conver the canvas to a data URL
    const dataURL = canvas.toDataURL('image/jpeg');

    // Create a new image element with the meme image
    const memeImage = new Image();
    memeImage.src = dataURL;


    // Append the meme image to the page
    $('#preview').html(memeImage);
}

const uploadMeme = async canvas => {
    canvas.toBlob(async function(blob) {
        const file = new File([blob], 'meme.jpeg', { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('meme_file', file);

        const response  = await fetch('/upload-meme/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRF(),
                'mode': 'same-origin',
                'Accept': 'application/json'
            }
        })
    });
}

$(document).ready(function() {
    $('#upload-form input').on('change', function() {
        const [top, bottom] = ['TOP TEXT', 'BOTTOM TEXT'];

        upload(top, bottom);
    })
})


$(document).ready(function() {
    $(document).on('click', '.default-template-select', async function() {
        $('.default-template-select').removeClass('selected');
        const el = $(this);
        el.addClass('selected');

        const topText = 'Top Text';
        const bottomText = 'Bottom Text';
        const canvas = await createCanvas(topText, bottomText, el.data('src'));
        showCanvas(canvas);
    })

    $('#create-meme-form input').on('input', async function() {
        const selectedTemplate = $('.default-template-select.selected');
        const src = selectedTemplate.data('src');
        if (!src) {
            return;
        }

        const formData = getFormData('create-meme-form');
        const canvas = await createCanvas(formData.top_text, formData.bottom_text, src);
        showCanvas(canvas);
    })
})