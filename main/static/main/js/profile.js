const loadProfile = async () => {
    const response = await sendGet('/profile-data/');
    const data = response.data;
    console.log(data);

    const {profile, memes, friend_count} = data;
    $('#profile-name').text(`${profile.first_name} ${profile.last_name}'s`);
    const memeEls = memes.map(meme => {
        return `<a class="section-load" data-section="view-meme" data-meme_uuid="${meme.uuid}"><img src="${meme.image}"></a>`
    });

    $('#profile-memes').html(memeEls.join(''));
}