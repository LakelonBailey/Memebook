const loadProfile = async (profileUUID=null, loadMemes=true) => {
    window.MEME_PAGINATION_PAGE = 1;
    window.MEME_PAGINATION_SIZE = 9;
    window.CURRENT_TAB = 'profile-memes';
    $('.section-tab').closest('li').removeClass('is-active');
    $('.section-tab[data-tab="profile-memes"]').closest('li').addClass('is-active');
    $('.friend-request-buttons button').hide();
    $('.friendship-decision-cont').hide();

    let requestURL = `/profile-data/`;
    if (profileUUID) {
        requestURL += '?profile_uuid=' + profileUUID
    }
    const response = await sendGet(requestURL);
    const data = response.data;

    const {profile, friend_count} = data;
    const viewMoreButton = $('.tab[data-section="profile"] .view-more-button');

    if (profile.is_current_user) {
        $('#profile-name').text('Your');
    }
    else {
        $('#profile-name').text(`${profile.first_name} ${profile.last_name}'s`);
    }

    fillForm('#profile-settings-form', profile);

    if (!(profile.is_current_user || profile.is_friend || !profile.is_private)) {
        $('#profile-memes').html('Friend this user to view their memes!');
        viewMoreButton.hide();
        return;
    }

    if (profile.is_current_user) {
        $('#settings-modal-trigger').show();
    }
    else {
        $('#settings-modal-trigger').hide();

        if (profile.requested_user_friendship) {
            loadFriendshipDecision(profile);
        }
        else if (profile.user_requested_friendship) {
            loadCancelRequestButton(profile);
        }
        else if (profile.is_friend) {
            loadRemoveFriendButton(profile);
        }
        else {
            loadRequestFriendButton(profile);
        }
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

    viewMoreButton.data('profileuuid', profile.uuid);

    window.PROFILE_UUID = profile.uuid;
    if (loadMemes) {
        await loadProfileMemes();
    }
}

const loadFriendshipDecision = requester => {
    $('#requester-name').text(requester.first_name);
    $('.friendship-decision-button').data('requester_uuid', requester.uuid);
    $('.friendship-decision-cont').show();
}

const loadRemoveFriendButton = friend => {
    const removeFriendButton = $('#remove-friend-button');
    removeFriendButton.data('friend_uuid', friend.uuid);
    removeFriendButton.show();
}

const loadCancelRequestButton = requestee => {
    const requestedButton = $('.friend-request-button[data-action="cancel"]');
    requestedButton.data('requestee_uuid', requestee.uuid);
    requestedButton.show();
}

const loadRequestFriendButton = requestee => {
    const requestedButton = $('.friend-request-button[data-action="request"]');
    $('#add-friend-text').text(requestee.is_private ? 'Request Friendship' : 'Add Friend');
    requestedButton.data('requestee_uuid', requestee.uuid);
    requestedButton.show();
}
const loadStandardProfileMemes = async () => {
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

const decideFriendship = async decisionData => {
    const response = await sendPost('/decide-friendship/', decisionData);
    if (response.ok) {
        const loadMemes = decisionData.action == 'accept';
        loadProfile(decisionData.requester_uuid, loadMemes);
    }
}


const requestFriend = async (friendData, buttonText) => {
    const response = await sendPost('/request-friendship/', friendData);
    if (response.ok && buttonText == 'Add Friend') {
        await loadProfile(friendData.requestee_uuid, true);
    }
}

const removeFriend = async friendData => {
    const response = await sendPost('/remove-friend/', friendData);
    if (response.ok) {
        await loadProfile(friendData.friend_uuid, true);
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

    $('.friendship-decision-button').on('click', async function() {
        const button = $(this);
        button.addClass('is-loading');
        await decideFriendship(button.data());
        button.closest('.friendship-decision-cont').hide();
    })

    $('.friend-request-button').on('click', async function() {
        const button = $(this);
        if (button.data('action') == 'request') {
            const buttonText = button.find('#add-friend-text').text();
            button.addClass('is-loading');
            await requestFriend(button.data(), buttonText);
            button.removeClass('is-loading');
            button.hide();
        }
    })

    $('#remove-friend-button').on('click', async function() {
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
        button.addClass('is-loading');
        await removeFriend(button.data());
        button.removeClass('is-loading');
        button.hide();
    })
})