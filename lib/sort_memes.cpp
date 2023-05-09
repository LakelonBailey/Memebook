#include <iostream>
#include <algorithm>
#include <map>
#include <string>
#include <vector>
#include <sstream>
#include <iterator>
#include <ctime>
#include <cstdio>
#include <cstring>
#include <cmath>
#include <random>
#include <numeric>
#include <cctype>
using namespace std;

// This code is designed to sort memes based on their relevance and recency.
// It uses a custom scoring algorithm to determine the importance of each meme.
// Compile with:
// g++ -shared -o lib/sort_memes.so lib/sort_memes.cpp -fPIC -std=c++11 -target x86_64-apple-macos11

// RelevanceMeme is a structure that represents a meme with attributes such as:
// - id: the meme's unique identifier
// - like_count: the number of likes the meme has received
// - relevance_score: a score representing how relevant the meme is
// - comment_count: the number of comments the meme has received
// - time_created: the time the meme was created
// - final_score: the final computed score for the meme
struct RelevanceMeme
{
    int id;
    int like_count;
    float relevance_score;
    int comment_count;
    int time_created;
    float final_score;
    RelevanceMeme(int id, int like_count, int relevance_score, int comment_count, int time_created)
    {
        this->id = id;
        this->like_count = like_count;
        this->relevance_score = relevance_score;
        this->comment_count = comment_count;
        this->time_created = max(((int)time(0) - time_created) / 3600, 6);
    }

    // score() calculates the final score of the meme using the attributes mentioned above.
    float score()
    {
        return (
            (1.0 + this->relevance_score) * (((float)this->like_count + 1.0) / (sqrt((float)this->time_created / 24) + 1.0)) * ((2.0 * (float)this->comment_count + 1.0) / (sqrt((float)this->time_created / 24) + 1.0)));
    }
};

// toLowerCase() is a utility function that takes a string as input and returns
// the same string with all characters converted to lowercase.
string to_lower_case(string str)
{
    transform(str.begin(), str.end(), str.begin(), [](unsigned char c)
              { return tolower(c); });
    return str;
}

// calculate_frequencies() takes a vector of words and returns a map with the
// relative frequency of each word in the input vector.
map<string, float> calculate_frequencies(const vector<string> &words)
{
    // Count the number of occurrences of each word
    map<string, int> counts;
    int max_count = 0;
    for (const auto &word : words)
    {
        max_count = max(max_count, ++counts[word]);
    }

    // Calculate the frequencies of each word
    map<string, float> frequencies;
    for (const auto &p : counts)
    {
        const auto &word = p.first;
        const auto &count = p.second;
        auto it = frequencies.emplace_hint(frequencies.end(), word, 0);
        it->second = 5 * (float)(count) / max_count;
    }

    return frequencies;
}

// get_relevance() takes a map of word frequencies and a string, and returns the
// relevance score for that string based on the frequencies of its words.
float get_relevance(const map<string, float> &frequencies, const string &word)
{
    vector<string> individual_words;
    stringstream ss(word);
    string temp;
    // Split the input string into words
    while (ss >> temp)
        individual_words.push_back(temp);

    // Calculate the relevance score by summing the frequencies of each word in the string
    float relevance = 0;
    for (const string &curr : individual_words)
    {
        if (frequencies.find(curr) != frequencies.end())
        {
            relevance += frequencies.at(curr);
        }
    }

    return relevance;
}

// compare_relevance_meme() is a comparison function used for sorting RelevanceMeme objects.
// It returns true if the final_score of the first meme is greater than the second meme.
int compare_relevance_meme(const RelevanceMeme &a, const RelevanceMeme &b)
{
    return a.final_score > b.final_score;
}

// compare_int_pair() is a comparison function used for sorting pairs of integers.
// It returns true if the second element of the first pair is greater than the second element of the second pair.
int compare_int_pair(pair<int, int> &a, pair<int, int> &b)
{
    return a.second > b.second;
}

extern "C"
{
    // sort_on_recent() takes the size of the input arrays, an array of meme IDs, and an array of times_created.
    // It sorts the meme_ids array based on the times_created array in descending order.
    void sort_on_recent(int size, int *meme_ids, int *times_created)
    {
        vector<pair<int, int>> meme_likes(size);

        for (int i = 0; i < size; i++)
        {
            meme_likes[i] = make_pair(meme_ids[i], times_created[i]);
        }

        // Sort meme_likes using the compare_int_pair function
        sort(meme_likes.begin(), meme_likes.end(), compare_int_pair);

        // Update the meme_ids array with the sorted IDs
        for (int i = 0; i < size; i++)
        {
            meme_ids[i] = meme_likes[i].first;
        }
    }

    // sort_on_relevance() sorts memes based on their relevance.
    // It takes the size of the input arrays, arrays of meme attributes, and an array of liked_text strings.
    // It updates the meme_ids array with the sorted meme IDs based on their relevance scores.
    void sort_on_relevance(int size, int *meme_ids, int *liked_count, const char **meme_text, int *comment_count, int *times_posted, const char **liked_text, int liked_text_size)
    {
        vector<string> meme_texts(meme_text, meme_text + size);
        vector<string> liked_meme_strings(liked_text, liked_text + liked_text_size);
        vector<string> individual_words;

        // Loop over each string in the liked_meme_strings vector
        for (const string &word : liked_meme_strings)
        {
            // Use a stringstream to split the string into words
            stringstream ss(word);
            string temp;

            while (ss >> temp)
            {
                // Add each word to the individual_words vector in lowercase
                individual_words.push_back(to_lower_case(temp));
            }
        }
        map<string, float> frequencies = calculate_frequencies(individual_words);

        vector<RelevanceMeme> memes;

        // Create RelevanceMeme objects and calculate their final scores
        for (int i = 0; i < size; i++)
        {
            memes.emplace_back(
                meme_ids[i],
                liked_count[i],
                get_relevance(frequencies, to_lower_case(meme_texts[i])),
                comment_count[i],
                times_posted[i]
            );
        }

        // Sort memes using the compare_relevance_meme function
        sort(memes.begin(), memes.end(), compare_relevance_meme);

        // Update the meme_ids array with the sorted meme IDs based on their relevance scores
        for (int i = 0; i < size; i++)
        {
            meme_ids[i] = memes[i].id;
        }
    }
}

