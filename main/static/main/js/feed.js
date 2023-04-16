const loadFeed = async () => {
    const response = await sendGet('/memes/');

    const memes = response.data.memes;

    listMemes($('#feed-memes'), memes);
}