import ctypes
import numpy as np
from main.models import Meme
from django.db.models import F
from time import time


sort_memes_lib = ctypes.CDLL(
    './lib/sort_memes.so'
)

int_arr_type = ctypes.POINTER(ctypes.c_int)
float_arr_type = ctypes.POINTER(ctypes.c_float)
string_arr_type = ctypes.POINTER(ctypes.c_char_p)
int_type = ctypes.c_int






sort_memes_lib.sort_on_likes.argtypes = [
    int_type,
    int_arr_type,
    int_arr_type
]
sort_memes_lib.sort_on_relevance.argtypes = [
    int_type,
    int_arr_type,
    string_arr_type,
    string_arr_type,
    int_arr_type
]

sort_memes_lib.sort_on_likes.restype = None
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
    if sorter == 'like_count':

        # Set sorter function
        sort_func = sort_memes_lib.sort_on_likes

        # Gather like counts and add to args
        like_counts = [meme.like_count for meme in memes]
        args.append(
            int_list_arg(int_list(like_counts))
        )

    elif sorter == 'relevance':

        # NOTE: Uncomment this line when you start using the liked_memes_text with this
        if profile is None:
            return []

        # Set sorter function
        sort_func = sort_memes_lib.sort_on_relevance

        # Gather top and bottom texts and add to args
        bottom_texts = []
        top_texts = []
        times_created = []
        for meme in memes:
            bottom_texts.append(meme.bottom_text)
            top_texts.append(meme.top_text)
            times_created.append(int(meme.created_at.timestamp()))

        args.extend([
            string_list_arg(top_texts),
            string_list_arg(bottom_texts),
            int_list_arg(int_list(times_created)),
        ])

    # A valid sorter string was not passed
    if sort_func is None:
        return []

    # Call sorter function
    start_time = time()
    sort_func(*args)
    print(time() - start_time)

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
