const loadFeedMemes = async (memes=null, lastPage) => {
    if (!memes) {
        const response = await sendGet(`/memes/?size=${window.MEME_PAGINATION_SIZE}&page=${window.MEME_PAGINATION_PAGE}`)
        lastPage = response.data.last_page;
        memes = response.data.memes;
    }

    listMemes($('#feed-memes'), memes);

    const viewMoreButton = $('.tab[data-section="feed"] .view-more-button');
    if (window.MEME_PAGINATION_PAGE == lastPage) {
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

    $('#feed-memes').html('');
    const response = await sendGet('/memes/');

    const memes = response.data.memes;

    loadFeedMemes(memes, response.data.last_page);
}