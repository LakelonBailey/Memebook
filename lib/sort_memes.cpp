#include <iostream>
#include <algorithm>
#include <map>
#include <string>
#include <vector>
#include <sstream>
#include <iterator>
#include <tuple>
#include <ctime>
#include <cstdio>
#include <cstring>
#include <cmath>
#include <random>
#include <numeric>
using namespace std;

// Compile with:
// g++ -shared -o lib/sort_memes.so lib/sort_memes.cpp -fPIC -std=c++11 -target x86_64-apple-macos11

struct RelevanceMeme {
    int id;
    int like_count;
    float relevance_score;
    int comment_count;
    int time_created;
    RelevanceMeme(int id, int like_count, int relevance_score, int comment_count, int time_created) {
        this->id = id;
        this->like_count = like_count;
        this->relevance_score = relevance_score;
        this->comment_count = comment_count;
        this->time_created = max(((int)time(0) - time_created) / 3600, 6);
    }

    float score() {
        return (
            (1.0 + this->relevance_score)
            * (((float)this->like_count + 1.0) / (sqrt((float)this->time_created / 24) + 1.0))
            * ((2.0 * (float)this->comment_count + 1.0) / (sqrt((float)this->time_created / 24) + 1.0)));
    }
};

map<string, float> calculate_frequencies(vector<string> &words) {
    // Count the number of occurrences of each word
    map<string, int> counts;
    int max_count = 0;
    for (vector<string>::iterator str = words.begin(); str != words.end(); str++) {
        max_count = max(max_count, ++counts[*str]);
    }

    // Calculate the frequencies of each word
    map<string, float> frequencies;
    for (map<string, int>::iterator it = counts.begin(); it != counts.end(); ++it) {
        frequencies[it->first] = 5 * ((float)it->second / max_count);
    }

    return frequencies;
}

float get_relevance(const map<string, float> &frequencies,const string &word) {
    vector<string> individual_words;
    stringstream ss(word);
    string temp;

    while (ss >> temp) individual_words.push_back(temp);

    float relevance = 0;
    for (const string &curr : individual_words) {
        if (frequencies.find(curr) != frequencies.end()) {
            relevance += frequencies.at(curr);
        }
    }

    return relevance;
}

int compare_relevance_meme(RelevanceMeme a, RelevanceMeme b) {
    return a.score() > b.score();
}

int compare_int_pair(pair<int, int> &a, pair<int, int> &b) {
    return a.second > b.second;
}

extern "C" {

    void sort_on_recent(int size, int* meme_ids, int* times_created) {
        vector<pair<int, int>> meme_likes(size);

        for (int i = 0; i < size; i++) {
            meme_likes[i] = make_pair(meme_ids[i], times_created[i]);
        }

        sort(meme_likes.begin(), meme_likes.end(), compare_int_pair);

        for (int i = 0; i < size; i++) {
            meme_ids[i] = meme_likes[i].first;
        }
    }

    void sort_on_relevance(int size, int *meme_ids, int *liked_count, const char **meme_text, int *comment_count, int *times_posted, const char **liked_text, int liked_text_size) {
        vector<string> meme_texts(meme_text, meme_text + size);
        vector<string> liked_meme_strings(liked_text, liked_text + liked_text_size);
        vector<string> individual_words;
        // Loop over each string in the original vector
        for (string word : liked_meme_strings) {
            // Use a stringstream to split the string into words
            stringstream ss(word);
            string temp;

            while (ss >> temp)
            {
                // Add each word to the new vector
                individual_words.push_back(temp);
            }
        }
        map<string, float> frequencies = calculate_frequencies(individual_words);

        vector<RelevanceMeme> memes;

        for (int i = 0; i < size; i++) {
            memes.emplace_back(
                meme_ids[i],
                liked_count[i],
                get_relevance(frequencies, meme_texts[i]),
                comment_count[i],
                times_posted[i]
            );
        }

        sort(memes.begin(), memes.end(), compare_relevance_meme);

        for (int i = 0; i < size; i++) {
            meme_ids[i] = memes[i].id;
        }
    }
}