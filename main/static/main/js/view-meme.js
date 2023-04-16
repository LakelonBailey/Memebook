const loadViewMeme = async memeUUID => {
    const memeRequest = new GeneralAPIRequest("Meme", {
        filter: {
            uuid: memeUUID
        },
        annotations: {
            like_count: {
                Count: 'likes'
            },
            comment_count: {
                Count: 'comments'
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

    const commentReponse = await sendGet(`/comments/?meme_id=${meme.uuid}`);
    if (commentReponse.ok) {
        loadComments(commentReponse.data.comments);
    }
}

const loadComments = async (comments=null) => {
    if (comments == null) {
        const sectionData = JSON.parse(localStorage.getItem('sectionData'))
        if (!(sectionData && sectionData.meme_uuid)) {
            return;
        }

        const commentReponse = await sendGet(`/comments/?meme_id=${sectionData.meme_uuid}`);
        if (!commentReponse.ok) {
            return;
        }
        comments = commentReponse.data.comments;
    }

    const commentEls = comments.map(comment => {
        const commentDate = new Date(comment.created_at);
        const timeString = commentDate.toLocaleString().replace(/:\d{2}(?=\s)/, '');
        const profileName = `${comment.profile.first_name} ${comment.profile.last_name}`
        return `
        <div class="comment-list-item">
            <div class="comment-info">
                <p><a class="section-load" data-section="profile" data-profileuuid="${comment.profile.uuid}">${profileName}</a> <span style="font-size: small;">${timeString}</span></p>
                <p class="comment-text ml-2">${comment.text}</p>
            </div>
            <div>
                <div class="dropdown is-hoverable">
                    <div class="dropdown-trigger">
                        <button class="button" aria-haspopup="true" aria-controls="${comment.uuid}-dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                    <div class="dropdown-menu" id="${comment.uuid}-dropdown" role="menu">
                        <div class="dropdown-content">
                            <div class="dropdown-item">
                                ${comment.belongs_to_user ? `<a class="delete-comment" data-commentuuid="${comment.uuid}">Delete</a><br/>`: ''}
                                <a>Report</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `
    });
    $('#comment-list').html(commentEls.join(''));
}

const deleteComment = async commentUUID => {
    if (!commentUUID) {
        return;
    }

    const response = await sendDelete('/comments/', {
        comment_uuid: commentUUID
    })
    if (response.ok) {
        loadComments();
    }
}

$(document).ready(function(){
    $('#add-comment-form').on('submit', async function(event) {
        event.preventDefault();
        const formData = getFormData('#add-comment-form');
        if (!formData.comment_text) {
            return;
        }
        $(this).find('button[type="submit"]').addClass('is-loading');
        await sendPost(`/comments/`, formData);
        await loadComments();
        $(this).find('button[type="submit"]').removeClass('is-loading');
        clearForm('#add-comment-form');
    })

    $(document).on('click', '.delete-comment', function() {
        deleteComment($(this).data('commentuuid'));
        $(this).closest('.comment-list-item').remove();
    })
})