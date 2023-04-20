const loadProfile = async (profileUUID=null) => {
    window.MEME_PAGINATION_PAGE = 1;
    window.MEME_PAGINATION_SIZE = 9;
    window.CURRENT_TAB = 'profile-memes';
    $('.section-tab').closest('li').removeClass('is-active');
    $('.section-tab[data-tab="profile-memes"]').closest('li').addClass('is-active');

    let requestURL = `/profile-data/`;
    if (profileUUID) {
        requestURL += '?profile_uuid=' + profileUUID
    }
    const response = await sendGet(requestURL);
    const profile = response.data.profile;
    const viewMoreButton = $('.tab[data-section="profile"] .view-more-button');

    if (profile.is_current_user) {
        $('#profile-name').text('Your');
    }
    else {
        $('#profile-name').text(`${profile.first_name} ${profile.last_name}'s`);
    }


    fillForm('#profile-settings-form', profile);
    const friendshipStatusEl = $('section[data-section="profile"] .friendship-status-buttons');
    if (profile.is_current_user) {
        friendshipStatusEl.hide();
        $('#settings-modal-trigger').show();
    }
    else {
        $('#settings-modal-trigger').hide();

        await loadFriendshipStatusButton({
            el: friendshipStatusEl,
            profile: profile,
            reloadProfile: false
        });
        friendshipStatusEl.show();
    }

    $('#meme-count').text(profile.meme_count);
    $('#friend-count').text(profile.friend_count);
    $('#like-count').text(profile.like_count);
    $('#profile-memes').html('');

    window.CAN_VIEW_LIKED_MEMES = (
        profile.liked_memes_privacy == 'Public'
        || (profile.liked_memes_privacy == 'Friends Only' && profile.is_friend)
        || profile.is_current_user
    );

    if (!(profile.is_current_user || profile.is_friend || !profile.is_private)) {
        $('#profile-memes').html('Friend this user to view their memes!');
        window.PRIVATE_MEMES = true;
        viewMoreButton.hide();
        return;
    }

    window.PRIVATE_MEMES = false;

    viewMoreButton.data('profileuuid', profile.uuid);

    window.PROFILE_UUID = profile.uuid;
    await loadProfileMemes();
}


const loadStandardProfileMemes = async () => {
    if (window.PRIVATE_MEMES) {
        $('#profile-memes').html('Friend this user to view their memes!');
        return;
    }
    window.MEME_PAGINATION_PAGE = 1;
    let url = `/memes/?size=${window.MEME_PAGINATION_SIZE}&page=${window.MEME_PAGINATION_PAGE}&profile_uuid=${window.PROFILE_UUID}`;
    const response = await sendGet(url);
    $('#profile-memes').html('');
    loadProfileMemes(response.data.memes);
}

const loadLikedMemes = async () => {
    window.MEME_PAGINATION_PAGE = 1;
    if (!window.CAN_VIEW_LIKED_MEMES) {
        $('#profile-memes').html("This profile's liked memes are private.");
        return;
    }
    let url = `/memes/?size=${window.MEME_PAGINATION_SIZE}&page=${window.MEME_PAGINATION_PAGE}&profile_uuid=${window.PROFILE_UUID}&filter_liked=True`;
    const response = await sendGet(url);
    $('#profile-memes').html('');
    loadProfileMemes(response.data.memes);
}

const loadProfileMemes = async (memes=null) => {
    if (!memes) {
        let url = `/memes/?size=${window.MEME_PAGINATION_SIZE}&page=${window.MEME_PAGINATION_PAGE}&profile_uuid=${window.PROFILE_UUID}`;
        if (window.CURRENT_TAB == 'liked') {
            url += '&filter_liked=True';
        }
        const response = await sendGet(url);
        memes = response.data.memes;
        lastPage = response.data.last_page;
    }

    listMemes($('#profile-memes'), memes);

    const viewMoreButton = $('.tab[data-section="profile"] .view-more-button');
    if (window.MEME_PAGINATION_PAGE >= lastPage) {
        viewMoreButton.hide();
    }
    else {
        viewMoreButton.show();
        window.MEME_PAGINATION_PAGE += 1;
    }

}


$(document).ready(function() {
    $('#profile-settings-form :input').on('change', async function() {
        const formData = getFormData('profile-settings-form');
        const response = await sendPost('/update-profile/', formData);
        if (response.ok) {
            savedToast();
        }
    });
})