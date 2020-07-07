"use strict";

// Global variables
const size = 13;
let totalSecondsPlayed = 0;
let playing = true;

// html elements
let htmlBoard;
let htmlGameOver;
let htmlRow;
let htmlBar;
let htmlTimer;
let htmlHints;
let htmlTimerIcon;
let canvas;

// Other variables that need to be global with the current setup
let highlightedCell;
let wordsFound = [];
let columns = 4;
const alphabet = 'abcdefghijklmnopqrstuvwxyz'

let hintCount = 3;
let wordsObject = null;

const star = '<svg class="c-hint-icon" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24"><g><path d="M0,0h24v24H0V0z" fill="none"/><path d="M0,0h24v24H0V0z" fill="none"/></g><g><path d="M12,17.27L18.18,21l-1.64-7.03L22,9.24l-7.19-0.61L12,2L9.19,8.63L2,9.24l5.46,4.73L5.82,21L12,17.27z"/></g></svg>'
const starOutline = '<svg class="c-hint-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>'

const updateHintsHTML = function() {
    let htmlString = `
    <div class="o-layout o-layout--justify-space-between o-layout--align-center">
        <p class="js-hint-text">Hint</p>
    `;

    for (let i=0; i<hintCount; i++) {
        htmlString += star;
    }

    for (let j=0; j<(3-hintCount); j++) {
        htmlString += starOutline;
    }

    htmlString += '</div>'
    htmlHints.innerHTML = htmlString;
}

const highlightCell = function(cell) {
    highlightedCell = cell;
    cell.classList.add("highlight");
}

const formatSeconds = function(allSeconds) {
    const minutes = Math.floor(allSeconds / 60);
    const seconds = allSeconds - (minutes * 60);
    return `${minutes.toString().padStart(2, 0)}:${seconds.toString().padStart(2, 0)}`;
}

const takeHint = function() {
    if (hintCount > 0) {
        hintCount -= 1;

        // Highlight some letter
        for (const word of Object.keys(wordsObject)) {
            // Only if the word has not yet been found
            if (!wordsFound.includes(wordsObject[word]['word'])) {
                highlightCell(
                    document.querySelector(`[data-x='${word.split('-')[0]}'][data-y='${word.split('-')[1]}']`)
                );
                break;
            }
        }

        // Update the stars in the hint box
        updateHintsHTML();

        // Disable after clicking last time
        if (hintCount == 0) {
            htmlHints.classList.remove('js-hint');
            htmlHints.classList.add('js-hint-disabled');   
        }
    }
}

const crossOutWord = function (word) {
    for (const w of document.querySelectorAll(".wordListItem")) {
        if (word === w.innerHTML) {
            w.classList.add("crossed");
            break;
        }
    }
};

const updateProgressBar = function (amountOfWords) {
    // update progressbar
    const percentage = `${Math.round(
        (wordsFound.length / amountOfWords) * 100
    )}%`;
    htmlBar.style.width = percentage;
    htmlBar.innerHTML = percentage;

    if (percentage === "100%") {
        htmlGameOver.classList.remove("disabled");
        playing = false;
    }
};

const pxToFloat = function (string) {
    return parseFloat(string.slice(0, -2));
};

const getREMPixels = function(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

const drawLine = function (startCellCoords, endCellCoords) {
    const startX = parseFloat(startCellCoords.split("-")[1]);
    const startY = parseFloat(startCellCoords.split("-")[0]);
    const endX = parseFloat(endCellCoords.split("-")[1]);
    const endY = parseFloat(endCellCoords.split("-")[0]);

    const cellSize = pxToFloat(canvas.style.width) / size;
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(
        (cellSize * startX + cellSize * 0.5),
        (cellSize * startY + cellSize * 0.5)
    );
    ctx.lineTo(
        (cellSize * endX + cellSize * 0.5),
        (cellSize * endY + cellSize * 0.5)
    );
    ctx.stroke();
};

const play = function() {
    // Pause icon
    htmlTimerIcon.innerHTML = '<svg class="c-timer-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M9 16h2V8H9v8zm3-14C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-4h2V8h-2v8z"/></svg>';
    playing = true;
}

const pause = function() {
    // Play icon
    htmlTimerIcon.innerHTML = '<svg class="c-timer-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M10 16.5l6-4.5-6-4.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';
    playing = false;
}

const addEventsToBoard = function (words) {
    for (const cell of document.querySelectorAll("td")) {
        cell.addEventListener("click", function () {
            // if the game was paused, resume
            if (!playing) {
                play();
            }

            if (highlightedCell != null) {
                // Clicked for 2nd time -> lookup word
                highlightedCell.classList.remove("highlight");

                // Store first letter coordinates in the right format
                const firstLetterX = highlightedCell.getAttribute("data-x");
                const firstLetterY = highlightedCell.getAttribute("data-y");
                const firstLetterCoords = `${firstLetterX}-${firstLetterY}`;

                // Store last letter coordinates in the right format
                const lastLetterX = this.getAttribute("data-x");
                const lastLetterY = this.getAttribute("data-y");
                const lastLetterCoords = `${lastLetterX}-${lastLetterY}`;

                // Check whether the selected word is in the list of words
                if (words.hasOwnProperty(firstLetterCoords)) {
                    if (
                        words[firstLetterCoords].last_letter ==
                            lastLetterCoords &&
                        !wordsFound.includes(words[firstLetterCoords].word)
                    ) {
                        // A word has been found
                        wordsFound.push(words[firstLetterCoords].word);
                        // Draw line
                        drawLine(firstLetterCoords, lastLetterCoords);

                        // Colorize the letters of the word that was found
                        for (const cell of words[firstLetterCoords]
                            .all_letters) {
                            // Get coordinates of each cell of the word
                            const cellX = cell.split("-")[0];
                            const cellY = cell.split("-")[1];
                            // Apply the style
                            document
                                .getElementById("playingBoard")
                                .rows[cellX].cells[cellY].classList.add(
                                    "found"
                                );

                            // Cross out the word
                            crossOutWord(words[firstLetterCoords].word);
                            // Update progressbar
                            updateProgressBar(Object.keys(words).length);
                        }
                    }
                }
                // Turn the highlighted cell off again
                highlightedCell = null;
            } else {
                // Clicked first time -> highlight current cell
                highlightCell(this);
            }
        });
    }
};

const randomLetter = function () {
    return 'x';
    // return alphabet[parseInt(Math.random() * 26)];
};

const createTable = function (puzzle) {
    // Generate html to form table
    let htmlString = '<table id="playingBoard">';
    for (let x = 0; x < size; x++) {
        htmlString += `<tr>`;
        for (let y = 0; y < size; y++) {
            let letter = randomLetter();
            const key = `${x}-${y}`;
            if (key in puzzle) {
                letter = puzzle[key];
            }
            htmlString += `<td data-x="${x}" data-y="${y}">${letter.toUpperCase()}</td>`;
        }
        htmlString += "</tr>";
    }
    htmlString += "</table>";

    // Put that table in the right div
    document.querySelector(".js-board").innerHTML = htmlString;
};

const createWordList = function (words) {
    let htmlString = '<ul class="wordList">';
    for (const key of Object.keys(words)) {
        htmlString += `<li class="wordListItem">${words[key].word}</li>`;
    }
    htmlString += "</ul>";

    document.querySelector(".js-words").innerHTML = htmlString;
    setColumnsWordList();
};

const showWordSearch = function (jsonObject) {
    wordsObject = jsonObject.words;
    createTable(jsonObject.puzzle);
    createWordList(wordsObject);
    addEventsToBoard(wordsObject);
};

const getWordSearch = function () {
    handleData(
        `http://127.0.0.1:5000/puzzle/${size}`,
        showWordSearch,
        callbackError
    );
};

const callbackError = function (e) {
    console.log("Failed to get word search puzzle");
    console.log(e);
};

const setDimensions = function () {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    let dimension = Math.min(windowWidth, windowHeight);

    if (dimension === windowWidth) {
        // width < height (= portrait mode)
        dimension = windowWidth * 0.75;
        columns = 3;
    } else {
        // height < width (= landscape)
        dimension = windowHeight * 0.7;
        columns = 4;
    }

    htmlRow.style.setProperty("width", `${dimension}px`);
    htmlRow.style.setProperty("height", `${dimension}px`);
    htmlRow.style.setProperty("left", `${(windowWidth - dimension) * 0.5}px`);

    // Overlay and align canvas
    canvas.width = dimension;
    canvas.height = dimension;
    canvas.style.setProperty("width", `${dimension}px`);
    canvas.style.setProperty("height", `${dimension}px`);
    canvas.style.setProperty("left", `${(windowWidth - dimension) * 0.5}px`);
    canvas.style.setProperty("top", `${20 + 6 + (parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.7)}px`);

    htmlGameOver.style.setProperty("left", `${0.1 * dimension}px`);
    htmlGameOver.style.setProperty("top", `${0.2 * dimension}px`);
    htmlGameOver.style.setProperty("height", `${0.35 * dimension}px`);

    setColumnsWordList();
};

const setColumnsWordList = function () {
    // Set amount of columns for the list of words
    const wordListItem = document.querySelector(".wordList");
    if (wordListItem) {
        wordListItem.style.setProperty("columns", columns);
        wordListItem.style.setProperty("-webkit-columns", columns);
        wordListItem.style.setProperty("-moz-columns", columns);
    }
};

const playPause = function() {
    if (playing) {
        pause();
    }   else {
        play();
    }
}

/* init */
const init = function () {
    canvas = document.querySelector("#canvas");
    htmlGameOver = document.querySelector(".js-game-over");
    htmlRow = document.querySelector(".o-row");
    htmlBar = document.querySelector(".bar");
    htmlHints = document.querySelector('.js-hint');
    htmlTimer = document.querySelector('.js-timer');
    htmlTimerIcon = document.querySelector('.js-timer-icon');

    setDimensions();
    getWordSearch();

    document
        .querySelector("#play-again")
        .addEventListener("click", function () {
            // refresh the page
            location.reload();
        });
    document
        .querySelector(".close-popup")
        .addEventListener("click", function () {
            htmlGameOver.classList.add("disabled");
        });

    htmlTimerIcon.addEventListener('click', function() {
        playPause();
    });

    // Also allow this to happen when clicking on the timer text
    document.querySelector('.js-timer').addEventListener('click', function() {
        playPause();
    });

    htmlHints.addEventListener('click', function() {
        takeHint();
    });

    setInterval(function(){
        if (playing) {
            totalSecondsPlayed += 1;
            htmlTimer.innerHTML = formatSeconds(totalSecondsPlayed);
        }
    }, 1000);
};

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", setDimensions);
