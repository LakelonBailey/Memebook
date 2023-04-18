const loadFeedMemes = async (memes=null, lastPage) => {
    if (!memes) {
        let url = `/memes/?size=${window.MEME_PAGINATION_SIZE}&page=${window.MEME_PAGINATION_PAGE}`;
        const response = await sendGet(url);
        lastPage = response.data.last_page;
        memes = response.data.memes;
    }

    listMemes($('#feed-memes'), memes);

    const viewMoreButton = $('.tab[data-section="feed"] .view-more-button');
    if (window.MEME_PAGINATION_PAGE >= lastPage) {
        viewMoreButton.hide();
    }
    else {
        viewMoreButton.show();
        window.MEME_PAGINATION_PAGE += 1;
    }

}

const loadFeed = async () => {
    window.MEME_PAGINATION_PAGE = 1;
    window.MEME_PAGINATION_SIZE = 25;
    $('.section-tab').closest('li').removeClass('is-active');
    $('.section-tab[data-tab="popular"]').closest('li').addClass('is-active');
    await loadFeedMemes();
}

const loadPopularFeed = async () => {
    window.MEME_PAGINATION_PAGE = 1;

    const response = await sendGet('/memes/');
    const memes = response.data.memes;
    $('#feed-memes').html('');
    loadFeedMemes(memes, response.data.last_page);
}

const loadFriendsFeed = async () => {
    window.MEME_PAGINATION_PAGE = 1;

    const response = await sendGet('/memes/?filter_friends=True');
    const memes = response.data.memes;
    $('#feed-memes').html('');
    loadFeedMemes(memes, response.data.last_page);
}

$(document).ready(function() {
    window.CURRENT_TAB = 'popular';
})