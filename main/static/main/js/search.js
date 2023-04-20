const searchProfiles = async () => {
    const {search_input} = getFormData('search-form');
    const response = await sendGet('/profiles/?search_input=' + search_input);
    const profiles = response.data.profiles;
    $('#search-results').html('<div class="lds-roller"><div></div><div></div><div></div><div></div></div>');
    let profileEls = [];
    for (let profile of profiles) {
        const friendStatusEl = await loadFriendshipStatusButton({
            el: $('<div class="friendship-status-buttons"></div>'),
            profile: profile,
        });

       const searchListItem = $();

        profileEls.push(`
            <div class="search-list-item">
                <div>
                    <a class="section-load" data-section="profile" data-profileuuid="${profile.uuid}">${profile.first_name} ${profile.last_name}</a>
                </div>
                <div class="friendship-status-buttons">
                    ${friendStatusEl.html()}
                </div>
            </div>
        `);
    }

    profileEls = await Promise.all(profileEls);
    $('#search-results').html(profileEls.join(''));
}

const loadSearch = async () => {
    await searchProfiles();
}

$(document).ready(function() {

    $('#search-form').on('submit', async function(event) {
        event.preventDefault();
        await searchProfiles();
    })
})
