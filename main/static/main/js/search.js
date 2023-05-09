const searchProfiles = async () => {

    // Get the search input value from the form data
    const { search_input } = getFormData('search-form');

    // Send a GET request to retrieve the profiles that match the search input
    const response = await sendGet('/profiles/?search_input=' + search_input);
    const profiles = response.data.profiles;

    // Display a loading spinner while the search results are being generated
    $('#search-results').html('<div class="lds-roller"><div></div><div></div><div></div><div></div></div>');

    const profileEls = await generateFriendList(profiles);
    $('#search-results').html(profileEls.join(''));
}

const loadSearch = async () => {
    // Call the searchProfiles function
    await searchProfiles();
}

$(document).ready(function () {
    // Call the searchProfiles function when the search form is submitted
    $('#search-form').on('submit', async function (event) {
        event.preventDefault();
        await searchProfiles();
    })
})
