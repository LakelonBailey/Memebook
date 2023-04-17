const loadProfile = async (profileUUID=null) => {
    window.MEME_PAGINATION_PAGE = 1;
    window.MEME_PAGINATION_SIZE = 9;

    let requestURL = `/profile-data/`;
    if (profileUUID) {
        requestURL += '?profile_uuid=' + profileUUID
    }
    const response = await sendGet(requestURL);
    const data = response.data;

    const {profile, friend_count} = data;
    if (profile.is_current_user) {
        $('#profile-name').text('Your');
    }
    else {
        $('#profile-name').text(`${profile.first_name} ${profile.last_name}'s`);
    }

    if (!(profile.is_current_user || profile.is_friend || !profile.is_private)) {
        $('#profile-memes').html('Friend this user to view their memes!');
        return;
    }

    const viewMoreButton = $('.tab[data-section="profile"] .view-more-button');
    viewMoreButton.data('profileuuid', profile.uuid);
    $('#profile-memes').html('');

    await loadProfileMemes(profile.uuid);
}

const loadProfileMemes = async (profileUUID) => {
    const url = `/memes/?size=${window.MEME_PAGINATION_SIZE}&page=${window.MEME_PAGINATION_PAGE}&profile_uuid=${profileUUID}`;
    const response = await sendGet(url);
    const lastPage = response.data.last_page;
    const memes = response.data.memes;

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