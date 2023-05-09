// Load profile
const loadProfile = async (profileUUID=null) => {

    // Set pagination variables
    window.MEME_PAGINATION_PAGE = 1;
    window.MEME_PAGINATION_SIZE = 9;
    window.CURRENT_TAB = 'profile-memes';
    $('.section-tab').closest('li').removeClass('is-active');
    $('.section-tab[data-tab="profile-memes"]').closest('li').addClass('is-active');

    // Construct URL for the profile data request
    let requestURL = `/profile-data/`;
    if (profileUUID) {
        requestURL += '?profile_uuid=' + profileUUID
    }

    // Send a GET request to retrieve the profile data
    const response = await sendGet(requestURL);
    const profile = response.data.profile;
    const viewMoreButton = $('.tab[data-section="profile"] .view-more-button');

    // Update the profile name based on whether it is the current user's profile or someone else's
    if (profile.is_current_user) {
        $('#profile-name').text('Your');
    }
    else {
        $('#profile-name').text(`${profile.first_name} ${profile.last_name}'s`);
    }

    // Fill in the profile settings form with the profile data
    fillForm('#profile-settings-form', profile);

    // Show or hide the friendship status buttons depending on whether it is the current user's profile or someone else's
    const friendshipStatusEl = $('section[data-section="profile"] .friendship-status-buttons');
    if (profile.is_current_user) {
        friendshipStatusEl.hide();
        $('#settings-modal-trigger').show();
        $('#friends-modal-trigger').show();
    }
    else {
        $('#settings-modal-trigger').hide();

        // Load the friendship status button for the profile
        await loadFriendshipStatusButton({
            el: friendshipStatusEl,
            profile: profile,
            reloadProfile: false
        });
        friendshipStatusEl.show();
    }

    // Display the meme, friend, and like counts for the profile
    $('#meme-count').text(profile.meme_count);
    $('#friend-count').text(profile.friend_count);
    $('#like-count').text(profile.like_count);
    $('#profile-memes').html('');

    // Determine whether the user can view the profile's liked memes
    window.CAN_VIEW_LIKED_MEMES = (
        profile.liked_memes_privacy == 'Public'
        || (profile.liked_memes_privacy == 'Friends Only' && profile.is_friend)
        || profile.is_current_user
    );

    // If the profile is private and not the current user's or a friend's, display a message and hide the view more button
    if (!(profile.is_current_user || profile.is_friend || !profile.is_private)) {
        $('#profile-memes').html('Friend this user to view their memes!');
        window.PRIVATE_MEMES = true;
        viewMoreButton.hide();
        return;
    }

    window.PRIVATE_MEMES = false;

    // Set the profile UUID and load the profile's memes
    viewMoreButton.data('profileuuid', profile.uuid);
    window.PROFILE_UUID = profile.uuid;
    await loadProfileMemes();
}




const loadStandardProfileMemes = async () => {
    if (window.PRIVATE_MEMES) {
        $('#profile-memes').html('Friend this user to view their memes!');
        return;
    }

    // Reset pagination variables and construct URL for the memes request
    window.MEME_PAGINATION_PAGE = 1;
    let url = `/memes/?size=${window.MEME_PAGINATION_SIZE}&page=${window.MEME_PAGINATION_PAGE}&profile_uuid=${window.PROFILE_UUID}`;

    // Send a GET request to retrieve the memes and display them
    const response = await sendGet(url);
    $('#profile-memes').html('');
    loadProfileMemes(response.data.memes);
}


const loadLikedMemes = async () => {
    // Reset pagination variables and construct URL for the liked memes request
    window.MEME_PAGINATION_PAGE = 1;
    if (!window.CAN_VIEW_LIKED_MEMES) {
        $('#profile-memes').html("This profile's liked memes are private.");
        return;
    }
    let url = `/memes/?size=${window.MEME_PAGINATION_SIZE}&page=${window.MEME_PAGINATION_PAGE}&profile_uuid=${window.PROFILE_UUID}&filter_liked=True`;

    // Send a GET request to retrieve the liked memes and display them
    const response = await sendGet(url);
    $('#profile-memes').html('');
    loadProfileMemes(response.data.memes);
}


const loadProfileMemes = async (memes=null) => {
    // If memes are not provided, construct URL for the memes request
    if (!memes) {
        let url = `/memes/?size=${window.MEME_PAGINATION_SIZE}&page=${window.MEME_PAGINATION_PAGE}&profile_uuid=${window.PROFILE_UUID}`;

        // If the current tab is 'liked', add a filter for liked memes
        if (window.CURRENT_TAB == 'liked') {
            url += '&filter_liked=True';
        }

        // Send a GET request to retrieve the memes and update the pagination variables
        const response = await sendGet(url);
        memes = response.data.memes;
        lastPage = response.data.last_page;
    }

    // Display the memes and update the view more button based on the pagination variables
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