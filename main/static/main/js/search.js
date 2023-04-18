const searchProfiles = async () => {
    const {search_input} = getFormData('search-form');
    const response = await sendGet('/profiles/?search_input=' + search_input);
    const profiles = response.data.profiles;
    $('#search-results').html('<div class="lds-roller"><div></div><div></div><div></div><div></div></div>');
    const profileEls = profiles.map(profile => {
        return $(`
            <div class="search-list-item section-load" data-section="profile" data-profileuuid="${profile.uuid}">
                <div>
                    <p>${profile.first_name} ${profile.last_name}</p>
                </div>
                ${profile.is_friend ? '<div><span><i class="fas fa-check"></i></span> <span>Friends</span></div>' : ''}
            </div>
        `)
    });

    $('#search-results').html(profileEls);
}

const loadSearch = async () => {
    await searchProfiles();
}

$(document).ready(function() {
    loadSearch();

    $('#search-form').on('submit', async function(event) {
        event.preventDefault();
        await searchProfiles();
    })
})
