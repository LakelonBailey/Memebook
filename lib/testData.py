import random
import time

# Create memeIDs array
memeIDs = [i for i in range(1, 401)]

# Create likedCount array with random integers
likedCount = [random.randint(0, 100000000) for _ in range(400)]

# Create words and words2 arrays with random strings
words = []
words2 = []
common_words = ['hello', 'world', 'python', 'programming','minecraft']
for _ in range(400):
    # Randomly select words with a weighted probability
    word1 = random.choices(common_words, weights=[10, 5, 3, 2, 1])[0]
    word2 = random.choices(common_words, weights=[10, 5, 3, 2, 1])[0]
    # Combine words into a phrase
    phrase = f"{word1} {word2}"
    # Add phrase to words and words2 arrays
    words.append(phrase)
common_words = ['dogs', 'man', 'balls', 'penis','minecraft']    
for _ in range(200):
    # Randomly select words with a weighted probability
    word1 = random.choices(common_words, weights=[10, 5, 3, 2, 1])[0]
    word2 = random.choices(common_words, weights=[10, 5, 3, 2, 1])[0]
    # Combine words into a phrase
    phrase = f"{word1} {word2}"
    # Add phrase to words and words2 arrays
    words2.append(phrase)
# Create commentCount array with random integers
commentCount = [random.randint(0, 10000000) for _ in range(400)]

# Create timePosted array with current time subtracted by a random integer
now = int(time.time())
timePosted = [now - random.randint(0, 200000000) for _ in range(400)]

# Print out arrays separated by commas
print(','.join(map(str, memeIDs)))
print(','.join(map(str, likedCount)))
print('\",\"'.join(words))
print('\",\"'.join(words2))
print(','.join(map(str, commentCount)))
print(',now-'.join(map(str, timePosted)))
