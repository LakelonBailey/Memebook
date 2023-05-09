import ctypes
import numpy as np


sort_memes_lib = ctypes.CDLL(
    './lib/sort_memes.so'
)

int_arr_type = ctypes.POINTER(ctypes.c_int)
float_arr_type = ctypes.POINTER(ctypes.c_float)
string_arr_type = ctypes.POINTER(ctypes.c_char_p)
int_type = ctypes.c_int






sort_memes_lib.sort_on_recent.argtypes = [
    int_type,
    int_arr_type,
    int_arr_type
]
sort_memes_lib.sort_on_relevance.argtypes = [
    int_type,
    int_arr_type,
    int_arr_type,
    string_arr_type,
    int_arr_type,
    int_arr_type,
    string_arr_type,
    int_type,
]

sort_memes_lib.sort_on_recent.restype = None
sort_memes_lib.sort_on_relevance.restype = None


def int_list(ints):
    return np.array(ints, dtype=np.int32)

def int_list_arg(int_list):
    return int_list.ctypes.data_as(ctypes.POINTER(ctypes.c_int))

def float_list(floats):
    return np.array(floats, dtype=np.float64)

def float_list_arg(float_list):
    return float_list.ctypes.data_as(ctypes.POINTER(ctypes.c_float))

def string_list_arg(strings):
    # Convert Python strings to bytes
    encoded_strings = [s.encode('utf-8') for s in strings]

    # Create an array of c_char_p pointers and initialize it with the encoded strings
    return (ctypes.c_char_p * len(strings))(*encoded_strings)


def sort_memes(memes, profile=None, sorter='like_count', start=0, stop=10, size=None, serialize=True):
    # Calculate size
    if size is None:
        size = len(memes)

    # Create temporary meme ids
    meme_ids = int_list(list(range(size)))

    # Store default args
    args = [
        size,
        int_list_arg(meme_ids)
    ]


    # Determine sorter function and add necessary arguments
    sort_func = None
    if sorter == 'recent':

        # Set sorter function
        sort_func = sort_memes_lib.sort_on_recent

        # Gather like counts and add to args
        times_created = [int(meme.created_at.timestamp()) for meme in memes]
        args.append(
            int_list_arg(int_list(times_created))
        )

    elif sorter == 'relevance':
        # NOTE: Uncomment this line when you start using the liked_memes_text with this
        if profile is None:
            return []

        liked_memes_text = profile.get_liked_memes_text()

        # Set sorter function
        sort_func = sort_memes_lib.sort_on_relevance

        meme_texts = []
        times_created = []
        like_counts = []
        comment_counts = []
        for meme in memes:
            meme_texts.append(f"{meme.top_text} {meme.bottom_text}")
            like_counts.append(meme.like_count)
            comment_counts.append(meme.comment_count)
            times_created.append(int(meme.created_at.timestamp()))

        args.extend([
            int_list_arg(int_list(like_counts)),
            string_list_arg(meme_texts),
            int_list_arg(int_list(comment_counts)),
            int_list_arg(int_list(times_created)),
            string_list_arg(liked_memes_text),
            len(liked_memes_text)
        ])

    # A valid sorter string was not passed
    if sort_func is None:
        return []

    # Call sorter function
    sort_func(*args)

    # Gather and return sorted memes
    new_memes = []
    for meme_id in meme_ids.tolist()[start:stop]:
        if serialize:
            new_memes.append(memes[meme_id].dict(
                exclude=['template'],
                keep_related=True
            ))
        else:
            new_memes.append(memes[meme_id])

    return new_memes
