const addLike = async likeEl => {
    const likeData = likeEl.data();
    const likeIcon = likeEl.find('i');
    let likeCount = parseInt(likeEl.find('.like-count').text());
    if (likeData.action == 'add') {
        likeIcon.removeClass('fa-regular').addClass('fa-solid');
        likeCount++;
        likeEl.data('action', 'delete');
        sendPost('/likes/', {
            meme_uuid: likeData.memeuuid
        });
    }
    else {
        likeIcon.removeClass('fa-solid').addClass('fa-regular');
        likeCount--;
        likeEl.data('action', 'add');
        sendDelete('/likes/', {
            meme_uuid: likeData.memeuuid
        });
    }
    likeEl.find('.like-count').text(likeCount.toString());
}

const listMemes = (el, memes) => {
    const memeEls = memes.map(meme => {
        return `
        <div class="meme-list-item">
            <a class="section-load" data-section="view-meme" data-meme_uuid="${meme.uuid}">
                <img src="${meme.image}">
            </a>
            <div class="meme-info">
                <a class="section-load" data-section="profile" data-profileuuid="${meme.profile.uuid}">
                    ${meme.profile.first_name} ${meme.profile.last_name}
                </a>
                <div class="meme-info-icons">
                    <p class="like-meme" data-memeuuid="${meme.uuid}" data-action="${meme.liked_by_user ? 'delete' : 'add'}"><i class="${meme.liked_by_user ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: #ff0000;"></i> <span class="like-count">${meme.like_count}</span></p>
                    <p><i class="fa-solid fa-comment" style="color: gray;"></i> <span>${meme.comment_count}</span></p>
                </div>
            </div>
        </div>
        `
    });
    el.html(memeEls.join(''));
}

$(document).ready(function() {
    window.LOAD_SECTION = async function(section, data={}) {
        if (section != window.CURRENT_SECTION) {
            // Remove the active classes from the current step.
            $('section.tab.active').removeClass('active');
            $(`.section-load`).removeClass('active');

            // Scroll to the top.
            $('#sections').scrollTop(0);

            window.CURRENT_SECTION = section;
            $(`section.tab[data-section="loader-view"]`).addClass('active');
            await window.LOAD_SECTION_DATA(data);
            $(`section.tab[data-section="loader-view"]`).removeClass('active');
            $(`section.tab[data-section="${section}"]`).addClass('active');
            localStorage.setItem('section', window.CURRENT_SECTION);

        }

    }
    window.LOAD_SECTION_DATA = async (data) => {
        const section = window.CURRENT_SECTION;
        if (section == 'create-meme') {
            await loadCreateMeme();
        }
        else if (section == 'profile') {
            await loadProfile(data.profileuuid);
        }
        else if (section == 'view-meme') {
            const memeUUID = data.meme_uuid;
            if (memeUUID == undefined) {
                window.LOAD_SECTION('profile');
                return;
            }
            await loadViewMeme(memeUUID);
        }
        else if (section == 'feed') {
            await loadFeed();
        }

        localStorage.setItem(
            'sectionData',
            JSON.stringify(data)
        );
    }

    // Handle section link click
    $(document).on('click', 'a.section-load', function() {
        const {section, ...data} = $(this).data();
        window.LOAD_SECTION(section || 'create-meme', data);
    })

    // Handle backend-established first page
    if (window.FIRST_PAGE) {
        const disabledPages = {};
        const currentDisables = disabledPages[window.FIRST_PAGE] || null;

        if (currentDisables != null) {
            if (currentDisables == 'ALL') {
                $(`.menu-list a`).addClass('is-disabled');
            }
            else {
                for (let page of currentDisables) {
                    $(`.menu-list a[data-section="${page}"]`).hide();
                }
            }
        }

        window.LOAD_SECTION(window.FIRST_PAGE);
        return;
    }
    const mainSection = 'profile';
    let section = localStorage.getItem('section') || mainSection;
    const hiddenSections = ['loader-view'];
    section = hiddenSections.includes(section) ? mainSection : section;
    const sectionData = JSON.parse(localStorage.getItem('sectionData') || "{}");
    window.LOAD_SECTION(section, sectionData);

    $(document).on('click', '.like-meme', function() {
        addLike($(this));
    })
})