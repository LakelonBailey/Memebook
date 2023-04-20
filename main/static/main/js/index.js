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

const listMemes = (el, memes, totalMemes) => {
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
                    <p><i class="${meme.commented_by_user ? 'fa-solid' : 'fa-regular'} fa-comment" style="color: gray;"></i> <span>${meme.comment_count}</span></p>
                </div>
            </div>
        </div>
        `
    });

    el.append(memeEls.join(''));
}


const decideFriendship = async decisionData => {
    await sendPost('/decide-friendship/', decisionData);
}

const requestFriend = async friendData => {
    await sendPost('/request-friendship/', friendData);
}

const removeFriend = async friendData => {
    await sendPost('/remove-friend/', friendData);
}

const cancelFriendRequest = async friendData => {
    await sendPost('/cancel-friend-request/', friendData);
}


const loadFriendshipStatusButton = async ({el, profile, profileUUID, reloadProfile} = {reloadProfile: true}) => {
    if (el == undefined) {
        return;
    }
    if (profileUUID == undefined && profile == undefined) {
        return;
    }
    if (profileUUID && profile == undefined) {
        const response = await sendGet(`/friendship-status/${profileUUID}/`);
        if (!response.ok) {
            return;
        }
        profile = response.data;
    }

    let buttonEl;
    if (profile.is_friend) {
        buttonEl = `
        <button class="button is-small remove-friend-button" data-friend_uuid="${profile.uuid}">
            <span class="icon">
              <i class="fa-solid fa-xmark"></i>
            </span>
            <span>Remove Friend</span>
        </button>
        `
    }
    else if (profile.user_requested_friendship) {
        buttonEl = `
        <button class="button is-small friend-request-button" data-action="cancel" data-requestee_uuid="${profile.uuid}">
            <span class="icon">
            <i class="fa-solid fa-xmark"></i>
            </span>
            <span>Cancel Request</span>
        </button>
        `;
    }
    else if (profile.requested_user_friendship) {
        buttonEl = `
        <div class="field friendship-decision-cont">
            <label class="label is-small">${profile.first_name} wants to be your friend:</label>
            <div class="buttons">
                <button class="button is-small friendship-decision-button is-success" data-action="accept" data-requester_uuid="${profile.uuid}">Accept</button>
                <button class="button is-small friendship-decision-button" data-action="ignore" data-requester_uuid="${profile.uuid}">Ignore</button>
            </div>
        </div>
        `;
    }
    else {
        buttonEl = `
        <button class="button is-small friend-request-button is-success" data-action="request" data-requestee_uuid="${profile.uuid}">
            <span class="icon">
              <i class="fa-solid fa-plus"></i>
            </span>
            <span>Add Friend</span>
        </button>
        `
    }

    el.html(buttonEl);

    if (reloadProfile && window.CURRENT_SECTION == 'profile') {
        loadProfile(profile.uuid);
    }

    return el;
}

$(document).ready(function() {
    window.MEME_PAGINATION_SIZE = 9;
    window.MEME_PAGINATION_PAGE = 1;

    window.LOAD_SECTION = async function(section, data={}) {
        if (section != window.CURRENT_SECTION || section == 'profile') {
            // Remove the active classes from the current step.
            $('section.tab.active').removeClass('active');
            $(`.section-load`).removeClass('active');

            // Scroll to the top.
            $('#sections').scrollTop(0);

            window.CURRENT_SECTION = section;
            $(`section.tab[data-section="loader-view"]`).addClass('active');
            $('.navbar-item').removeClass('is-active');
            const navBarEl = $(`#navbar-main .navbar-item[data-section="${section}"]`);
            if (section != 'profile' || (section == 'profile' && !data.profileuuid)) {
                navBarEl.addClass('is-active');
            }
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
        else if (section == 'search') {
            await loadSearch();
        }

        localStorage.setItem(
            'sectionData',
            JSON.stringify(data)
        );
    }

    // Handle section link click
    $(document).on('click', '.section-load', function() {
        const el = $(this);
        const {section, ...data} = el.data();
        if (el.hasClass('navbar-item')) {
            $('a.navbar-item').removeClass('is-active');
            $(`#navbar-main .navbar-item[data-section="${section}"]`).addClass('is-active');
        }
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

    $('.view-more-button').on('click', async function() {
        const button = $(this);
        button.addClass('is-loading');
        const section = button.data('section');
        if (section == 'feed') {
            await loadFeedMemes();
        }
        else if (section == 'profile') {
            await loadProfileMemes();
        }
        button.removeClass('is-loading');
    })

    $('.section-tab').on('click', async function() {
        const tabEl = $(this);
        const tabName = tabEl.data('tab');
        const section = tabEl.closest('section.tab').data('section');
        if (tabName == window.CURRENT_TAB) {
            return;
        }
        window.CURRENT_TAB = tabName;

        $(`#${section}-memes`).html('<div class="lds-roller"><div></div><div></div><div></div><div></div></div>')
        $('.section-tab').closest('li').removeClass('is-active');
        $(`.tab[data-section="${section}"] .view-more-button`).hide();
        tabEl.closest('li').addClass('is-active');

        const pageLoaders = {
            'friends': loadFriendsFeed,
            'popular': loadPopularFeed,
            'profile-memes': loadStandardProfileMemes,
            'liked': loadLikedMemes
        }
        const loader = pageLoaders[tabName];
        if (loader) {
            await loader();
        }

        window.CURRENT_TAB = tabName;
    });

    $(document).on('click','.friendship-decision-button', async function() {
        const button = $(this);
        const container = button.closest('.friendship-status-buttons');
        button.addClass('is-loading');
        await decideFriendship(button.data());
        await loadFriendshipStatusButton({
            el: container,
            profileUUID: button.data('requester_uuid'),
            reloadProfile: button.data('action') == 'accept'
        });
    })

    $(document).on('click', '.friend-request-button', async function() {
        const button = $(this);
        const container = button.closest('.friendship-status-buttons');
        button.addClass('is-loading');
        if (button.data('action') == 'request') {
            await requestFriend(button.data());
        }
        else {
            await cancelFriendRequest(button.data());
        }

        await loadFriendshipStatusButton({
            el: container,
            profileUUID: button.data('requestee_uuid'),
            reloadProfile: false
        });
    })

    $(document).on('click', '.remove-friend-button', async function() {
        const {isConfirmed} = await swalConfirm.fire({
            title: 'Are you sure?',
            icon: 'warning',
            text: "Are you sure you want to remove this friend?",
            showDenyButton: true,
            confirmButtonText: 'Yes',
            denyButtonText: `No`,
        });

        if (!isConfirmed) {
            return;
        }
        const button = $(this);
        const container = button.closest('.friendship-status-buttons');
        button.addClass('is-loading');
        await removeFriend(button.data());
        await loadFriendshipStatusButton({
            el: container,
            profileUUID: button.data('friend_uuid')
        });
    })
})