from PySide2 import QtWidgets, QtGui
import random
import sys
import string
from pynput.mouse import Button, Controller

# Every Qt application must have one and only one QApplication object;
# it receives the command line arguments passed to the script, as they
# can be used to customize the application's appearance and behavior
qt_app = QtWidgets.QApplication(sys.argv)


class TableWidget(QtWidgets.QTableWidget):
    def __init__(self, parent=None):
        QtWidgets.QTableWidget.__init__(self, parent=parent)
        self.parent = parent

    def mouseReleaseEvent(self, event: QtGui.QMouseEvent):
        # Call function in the main window
        self.parent.released_tableview(self.selectedIndexes())


class CrossWordPuzzle(QtWidgets.QMainWindow):
    def __init__(self):
        super(CrossWordPuzzle, self).__init__()

        self.setWindowTitle('woordzoeker')

        # Create widget that will contain all of the UI elements
        self.window_widget = QtWidgets.QWidget()
        self.setCentralWidget(self.window_widget)

        self.main_layout = QtWidgets.QVBoxLayout()
        self.grid_size = 13

        self.table_view = TableWidget(self)
        # Disable all kinds of editing / highlighting
        self.table_view.setEditTriggers(QtWidgets.QAbstractItemView.NoEditTriggers)
        # self.table_view.setFocusPolicy(QtGui.Qt.NoFocus)
        palette = self.table_view.palette()
        palette.setBrush(QtGui.QPalette.Highlight, QtGui.QBrush(QtGui.Qt.white))
        palette.setBrush(QtGui.QPalette.HighlightedText, QtGui.QBrush(QtGui.Qt.black))
        self.table_view.setPalette(palette)

        self.table_view.setRowCount(self.grid_size)
        self.table_view.setColumnCount(self.grid_size)

        self.table_view.horizontalHeader().setSectionResizeMode(QtWidgets.QHeaderView.Stretch)
        self.table_view.verticalHeader().setSectionResizeMode(QtWidgets.QHeaderView.Stretch)

        self.table_view.horizontalHeader().hide()
        self.table_view.verticalHeader().hide()

        self.words_layout = QtWidgets.QGridLayout()

        self.index_dict = {}
        self.words_dict = {}
        self.full_word_pos = {}

        self.found_coords = {}
        self.found_words = []

        self.words = [
            'test',
            'simon',
            'youtube',
            'facebook',
            'luna',
            'dance',
            'monkey',
            'grid',
            'widget',
            'python',
            'live',
            'netflix',
            'classroom',
            'publish',
            'views',
            'share',
        ]

        # # invert 40% of the words (maybe too difficult)
        # for index, word in enumerate(self.words):
        #     if random.uniform(0, 1) < 0.4:
        #         self.words[index] = word[::-1]

        self.draw_words()
        self.fill_grid()

        self.main_layout.addWidget(self.table_view)

        self.fill_word_list()

        self.main_layout.addLayout(self.words_layout)
        self.window_widget.setLayout(self.main_layout)

    def fill_word_list(self):
        """
        displays the words under the grid
        :return:
        """
        for i in reversed(range(self.words_layout.count())):
            self.words_layout.itemAt(i).widget().setParent(None)

        self.found_words = list(set(self.found_words))

        col = -1
        row = 0
        for index, word in enumerate(self.words):
            if index % int(len(self.words) / 3) == 0:
                col += 1
                row = 0
            row += 1
            if word in self.found_words:
                word_label = QtWidgets.QLabel(str(word).upper())
                f = word_label.font()
                f.setStrikeOut(True)
                word_label.setFont(f)
                self.words_layout.addWidget(word_label, *(row, col))
            else:
                self.words_layout.addWidget(QtWidgets.QLabel(str(word).upper()), *(row, col))

        # Remove current progress bar widget, under the table widget, (at index 1)
        if self.main_layout.count() > 1:
            item = self.main_layout.itemAt(1)
            self.main_layout.removeItem(item)

        bar = QtWidgets.QProgressBar()
        bar.setStyleSheet(
            " QProgressBar { border: 1px solid grey; text-align: center; height: 2px;} QProgressBar::chunk {background-color: #3add36; width: 1px;}")
        bar.setRange(0, len(self.words))
        bar.setValue(len(self.found_words))

        self.main_layout.insertWidget(1, bar)

    def draw_words(self):
        for word in self.words:
            # 0 = Horizontal, 1 = Vertical, 2 = Diagonal LtoR, 3 = Diagonal RtoL
            # alignment = random.randrange(0, 3)

            used_indices = []
            coord_dict = {}

            # Fetch coordinates that are currently occupied
            for key in self.index_dict.keys():
                used_indices.append(key)

            # Init duplicates variable
            same_coord = False

            while not same_coord:
                alignment = random.randrange(0, 3)

                if alignment == 0:
                    coord_dict = self.horizontal_word(word)
                if alignment == 1:
                    coord_dict = self.vertical_word(word)
                if alignment == 2:
                    coord_dict = self.diagonal_word(word)

                if len(used_indices) > 0:
                    used_indices_set = set(used_indices)
                    # List the indexes of the coord_dict keys that are already in used
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
                            if self.index_dict[coord] != coord_dict[coord]:
                                same_coord = False
                                break
                    # same_coord = not any(elem in coord_dict.keys() for elem in used_indices)

                else:
                    same_coord = True

            self.full_word_pos[word] = list(coord_dict.keys())
            self.words_dict[list(coord_dict.keys())[0]] = [list(coord_dict.keys())[len(word) - 1], word]
            self.index_dict.update(coord_dict)

    def horizontal_word(self, word):
        coord_dict = {}

        first_index_row = random.randrange(0, self.grid_size)
        first_index_col = random.randrange(0, self.grid_size - len(word))

        coord_dict[(first_index_row, first_index_col)] = word[0]
        # There is only one row, multiple columns
        for index, char in enumerate(word):
            if index > 0:
                coord_dict[(first_index_row, first_index_col + index)] = char

        return coord_dict

    def vertical_word(self, word):
        coord_dict = {}

        first_index_row = random.randrange(0, self.grid_size - len(word))
        first_index_col = random.randrange(0, self.grid_size)

        coord_dict[(first_index_row, first_index_col)] = word[0]
        for index, char in enumerate(word):
            if index > 0:
                coord_dict[(first_index_row + index, first_index_col)] = char

        return coord_dict

    def diagonal_word(self, word):
        coord_dict = {}

        first_index_row = random.randrange(0, self.grid_size - len(word))
        first_index_col = random.randrange(0, self.grid_size - len(word))

        coord_dict[(first_index_row, first_index_col)] = word[0]

        for index, char in enumerate(word):
            if index > 0:
                coord_dict[(first_index_row + index, first_index_col + index)] = char

        return coord_dict

    def fill_grid(self):
        self.table_view.clear()

        for x in range(self.grid_size):
            for y in range(self.grid_size):
                index = (x, y)
                if index not in self.index_dict.keys():
                    # self.index_dict[index] = ' '
                    self.index_dict[index] = random.choice(string.ascii_uppercase)

                # label = QLabel(str(self.index_dict[index]).upper())
                self.table_view.setItem(x, y, QtWidgets.QTableWidgetItem(str(self.index_dict[index]).upper()))
                self.table_view.item(x, y).setTextAlignment(QtGui.Qt.AlignCenter)
                if index in self.found_coords.keys():
                    self.table_view.item(x, y).setBackground(self.found_coords[index])

    def released_tableview(self, indexes):
        first_index = (indexes[0].row(), indexes[0].column())
        last_index = (indexes[len(indexes)-1].row(), indexes[len(indexes)-1].column())

        if self.words_dict.get(first_index, [None])[0] == last_index:
            rand_col = QtGui.QColor(random.randrange(0, 255), random.randrange(0, 255), random.randrange(0, 255))
            self.found_words.append(self.words_dict[first_index][1])
            coords = self.full_word_pos.get(self.words_dict.get(first_index, [None])[1], None)

            for coord in coords:
                self.found_coords[coord] = rand_col

            self.fill_word_list()
        self.fill_grid()

    def run(self):
        """
        Runs the application and shows the window
        """
        # Show the window
        self.show()
        # Run the qt application
        qt_app.exec_()


puzzle = CrossWordPuzzle()
puzzle.run()
