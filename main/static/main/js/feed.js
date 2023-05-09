// Load feed memes
const loadFeedMemes = async (memes=null, lastPage) => {

    // If memes aren't provided, retrieve them with pagination parameters
    if (!memes) {
        let url = `/memes/?size=${window.MEME_PAGINATION_SIZE}&page=${window.MEME_PAGINATION_PAGE}`;
        const response = await sendGet(url);
        lastPage = response.data.last_page;
        memes = response.data.memes;
    }

    // List memes
    listMemes($('#feed-memes'), memes);

    // Determine if view more button needs to be visible
    const viewMoreButton = $('.tab[data-section="feed"] .view-more-button');
    if (window.MEME_PAGINATION_PAGE >= lastPage) {
        viewMoreButton.hide();
    }
    else {
        viewMoreButton.show();
        window.MEME_PAGINATION_PAGE += 1;
    }

}

// Load feed page
const loadFeed = async () => {

    // Reset pagination variables
    window.MEME_PAGINATION_PAGE = 1;
    window.MEME_PAGINATION_SIZE = 9;

    // Set link classes
    $('.section-tab').closest('li').removeClass('is-active');
    $('.section-tab[data-tab="popular"]').closest('li').addClass('is-active');

    // Load memes
    await loadFeedMemes();
}

// Load popular feed
const loadPopularFeed = async () => {

    // Reset pagination variables
    window.MEME_PAGINATION_PAGE = 1;
    window.MEME_PAGINATION_SIZE = 9;

    // Get memes and display them
    const response = await sendGet('/memes/');
    const memes = response.data.memes;
    $('#feed-memes').html('');
    loadFeedMemes(memes, response.data.last_page);
}

// Load friends feed (only requires the addition of a parameter)
const loadFriendsFeed = async () => {
    window.MEME_PAGINATION_PAGE = 1;

    const response = await sendGet('/memes/?filter_friends=True');
    const memes = response.data.memes;
    $('#feed-memes').html('');
    loadFeedMemes(memes, response.data.last_page);
}

$(document).ready(function() {

    // Reset current tab
    window.CURRENT_TAB = 'popular';
})