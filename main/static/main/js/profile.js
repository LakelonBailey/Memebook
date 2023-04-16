const loadProfile = async (profileUUID=null) => {
    let requestURL = '/profile-data/';
    if (profileUUID) {
        requestURL += '?profile_uuid=' + profileUUID
    }
    const response = await sendGet(requestURL);
    const data = response.data;

    const {profile, memes, friend_count} = data;
    if (profile.is_current_user) {
        $('#profile-name').text('Your');
    }
    else {
        $('#profile-name').text(`${profile.first_name} ${profile.last_name}'s`);
    }
    let memeEls;
    if (!(profile.is_current_user || profile.is_friend)) {
        memeEls = [`Friend this user to view their memes!`];
    }
    else {
        listMemes($('#profile-memes'), memes);
        return;
    }

    $('#profile-memes').html(memeEls.join(''));
}