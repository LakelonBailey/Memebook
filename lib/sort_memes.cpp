#include <vector>
#include <algorithm>
#include <iostream>

// Compile with:
// g++ -shared -o lib/sort_memes.so lib/sort_memes.cpp -fPIC -std=c++11 -target x86_64-apple-macos11
extern "C" {


    int sort_int_compare(std::pair<int, int> &a, std::pair<int, int> &b) {
        return a.second > b.second;
    }

    void sort_on_likes(int size, int* meme_ids, int* like_counts) {
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

    void sort_on_relevance(int size, int* meme_ids, char** top_texts, char** bottom_texts, int *times_created) {
        std::vector<std::string> top_texts_vec(top_texts, top_texts + size);
        std::vector<std::string> bottom_texts_vec(bottom_texts, bottom_texts + size);

        for (size_t i = 0; i < top_texts_vec.size(); i++) {
            std::cout << top_texts_vec[i] << ' ' << bottom_texts_vec[i] << ' '  << times_created[i] << '\n';
        }
    }
}