import random
from backend.repositories.DataRepository import DataRepository


class WordSearchGenerator:
    def __init__(self, size):
        self._min_size = 1
        self._max_size = 30
        self.size = size

    @property
    def size(self):
        return self._size
    @size.setter
    def size(self, value):
        if type(value) is int:
            if self._min_size < value < self._max_size:
                self._size = value
            else:
                raise ValueError("Size is not between the boundaries (%s-%s)" % (self._min_size, self._max_size))
        else:
            raise ValueError("Size %s is not valid, must be of type int" % value)

    def generate_puzzle(self):
        all_words = [
            word['word'] for word in DataRepository.get_all_words()
            if self.size > len(word['word']) > 2
        ]
        random.shuffle(all_words)
        # base words
        words = all_words[:int(self.size * 1.3)]
        # append some smaller words
        for w in all_words[int(self.size * 1.3):]:
            if len(w) < int(self.size * 0.35):
                if len(words) < int(self.size * 2.1):
                    if w not in words:
                        words.append(w)
                        continue
            elif len(w) < int(self.size * 0.5):
                if len(words) < int(self.size * 1.7):
                    if w not in words:
                        words.append(w)
                        continue

        # # invert 40% of the words (maybe too difficult)
        # for index, word in enumerate(self.words):
        #     if random.uniform(0, 1) < 0.4:
        #         words[index] = word[::-1]

        index_dict = dict()
        words_dict = dict()
        placed_words = []
        for word in words:
            # 0 = Horizontal, 1 = Vertical, 2 = Diagonal LtoR, 3 = Diagonal RtoL
            # alignment = random.randrange(0, 3)

            used_indices = []
            coord_dict = {}

            # Fetch coordinates that are currently occupied
            for key in index_dict.keys():
                used_indices.append(key)

            # Init duplicates variable
            same_coord = False
            attemps = 0

            while not same_coord:
                attemps += 1

                if attemps > 10:
                    try:
                        # If the word has already failed 10 times, try a shorter word
                        word = next(
                            w for w in all_words
                            if w not in placed_words and
                            w not in words and
                            len(w) < len(word)
                        )
                        attemps = 0
                    except StopIteration:
                        # no valid word could be found (probably bcus the length dropped to < 3)
                        same_coord = True

                alignment = random.randrange(0, 3)

                if alignment == 0:
                    coord_dict = self.horizontal_word(word)
                if alignment == 1:
                    coord_dict = self.vertical_word(word)
                if alignment == 2:
                    coord_dict = self.diagonal_word(word)

                if len(used_indices) > 0:
                    used_indices_set = set(used_indices)
                    # List the indexes of the coord_dict keys that are already in use
                    # If the letter in this coordinate is not the same as the letter we are trying to put here,
                    # Recompute the coordinates for the current word
                    list_of_matches = [i for i, item in enumerate(list(coord_dict.keys())) if item in used_indices_set]

                    # If there are no matches, just continue
                    if len(list_of_matches) == 0:
                        same_coord = True

                    else:
                        # If there are matches, check whether the letter we are trying to place in the given coordinate
                        # is same as the letter that is currently at that position
                        # If it is, also continue
                        same_coord = True

                        for match in list_of_matches:
                            coord = list(coord_dict.keys())[match]
                            # As soon as one of the matches doesnt match the letter we already have in said location,
                            # break off and regenerate coordinates for the current word
                            if index_dict[coord] != coord_dict[coord]:
                                same_coord = False
                                break

                else:
                    same_coord = True

            placed_words.append(word)
            index_dict.update(coord_dict)
            words_dict[list(coord_dict.keys())[0]] = {
                'last_letter': list(coord_dict.keys())[-1],
                'word': word,
                'all_letters': list(coord_dict.keys()),
            }

        return index_dict, words_dict

    def horizontal_word(self, word):
        coord_dict = {}

        first_index_row = random.randrange(0, self.size)
        first_index_col = random.randrange(0, (self.size - len(word)))

        # coord_dict[(first_index_row, first_index_col)] = word[0]
        coord_dict["%d-%d" % (first_index_row, first_index_col)] = word[0]
        # There is only one row, multiple columns
        for index, char in enumerate(word):
            if index > 0:
                # coord_dict[(first_index_row, first_index_col + index)] = char
                coord_dict["%d-%d" % (first_index_row, first_index_col + index)] = char

        return coord_dict

    def vertical_word(self, word):
        coord_dict = {}

        first_index_row = random.randrange(0, (self.size - len(word)))
        first_index_col = random.randrange(0, self.size)

        coord_dict["%d-%d" % (first_index_row, first_index_col)] = word[0]
        for index, char in enumerate(word):
            if index > 0:
                # coord_dict[(first_index_row + index, first_index_col)] = char
                coord_dict["%d-%d" % (first_index_row + index, first_index_col)] = char

        return coord_dict

    def diagonal_word(self, word):
        coord_dict = {}

        # print("randrange 0, %s" % (self.size - len(word)))
        first_index_row = random.randrange(0, (self.size - len(word)))
        first_index_col = random.randrange(0, (self.size - len(word)))

        coord_dict["%d-%d" % (first_index_row, first_index_col)] = word[0]
        for index, char in enumerate(word):
            if index > 0:
                # coord_dict[(first_index_row + index, first_index_col + index)] = char
                coord_dict["%d-%d" % (first_index_row + index, first_index_col + index)] = char

        return coord_dict
