const searchProfiles = async () => {

    // Get the search input value from the form data
    const {search_input} = getFormData('search-form');

    // Send a GET request to retrieve the profiles that match the search input
    const response = await sendGet('/profiles/?search_input=' + search_input);
    const profiles = response.data.profiles;

    // Display a loading spinner while the search results are being generated
    $('#search-results').html('<div class="lds-roller"><div></div><div></div><div></div><div></div></div>');

    // Generate the HTML elements for each search result profile
    let profileEls = [];
    for (let profile of profiles) {
        // Load the friendship status button for the profile
        const friendStatusEl = await loadFriendshipStatusButton({
            el: $('<div></div>'),
            profile: profile,
        });

        // Construct the HTML element for the search result profile
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

    // Convert the HTML elements to strings and display them
    profileEls = await Promise.all(profileEls);
    $('#search-results').html(profileEls.join(''));
}

const loadSearch = async () => {
    // Call the searchProfiles function
    await searchProfiles();
}

$(document).ready(function() {
    // Call the searchProfiles function when the search form is submitted
    $('#search-form').on('submit', async function(event) {
        event.preventDefault();
        await searchProfiles();
    })
})
