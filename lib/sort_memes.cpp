#include <vector>
#include <algorithm>

// Compile with: g++ -shared -o sort_memes.so sort_memes.cpp -fPIC -std=c++11 -target x86_64-apple-macos11
extern "C" {


    int sort_int_compare(std::pair<int, int> &a, std::pair<int, int> &b) {
        return a.second > b.second;
    }

    void sort_on_likes(int* meme_ids, int* like_counts, int size) {
        std::vector<std::pair<int, int>> meme_likes(size);

        for (int i = 0; i < size; i++) {
            meme_likes[i] = std::make_pair(meme_ids[i], like_counts[i]);
        }

        std::sort(meme_likes.begin(), meme_likes.end(), sort_int_compare);

        for (int i = 0; i < size; i++) {
            meme_ids[i] = meme_likes[i].first;
            like_counts[i] = meme_likes[i].second;
        }
    }
}