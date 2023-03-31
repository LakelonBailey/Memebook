const loadViewMeme = async memeUUID => {
    const memeRequest = new GeneralAPIRequest("Meme", {
        filter: {
            uuid: memeUUID
        },
        prefetchRelated: ['comments'],
        annotations: {
            like_count: {
                Count: 'likes'
            }
        },
        keepRelated: true,
        customSerializer: true,
        exclude: ['template']
    })

    const response = await memeRequest.send();
    const meme = response.data.data[0];
    $('#add-comment-form input[name="meme_uuid"]').val(meme.uuid);
    $('#view-meme-img').attr('src', meme.image);

    loadComments(meme.comments);
}

const loadComments = async (comments=null) => {
    if (comments == null) {
        const sectionData = JSON.parse(localStorage.getItem('sectionData'))
        if (!(sectionData && sectionData.meme_uuid)) {
            return;
        }

        const commentRequest = new GeneralAPIRequest("Comment", {
            filter: {
                meme_id: sectionData.meme_uuid
            },
            selectRelated: ['profile'],
            exclude: ['meme'],
            customSerializer: true,
            keepRelated: true,
        })
        const response = await commentRequest.send();
        if (!response.ok) {
            return;
        }
        comments = response.data.data;
    }

    const commentEls = comments.map(comment => {
        const profileName = `${comment.profile.first_name} ${comment.profile.last_name}`
        return `
        <div class="comment-list-item">
            <p><a class="comment-profile">${profileName}</a></p>
            <p class="comment-text">${comment.text}</p>
        </div>
        `
    });
    $('#comment-list').html(commentEls.join(''));
}

$(document).ready(function(){
    $('#add-comment-form').on('submit', async function(event) {
        event.preventDefault();
        const formData = getFormData('#add-comment-form');
        if (!formData.comment_text) {
            return;
        }
        const response = await sendPost(`/comments/`, formData);
        if (response.ok) {
            loadComments();
        }
    })
})