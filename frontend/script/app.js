"use strict";

// Global variables
const size = 13;
let htmlBoard;
let htmlGameOver
let htmlRow;
let htmlBar
let canvas;
let highlightedCell;
let wordsFound = [];
let columns = 4;

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
    }
};

const pxToFloat = function (string) {
    return parseFloat(string.slice(0, -2));
};

const drawLine = function (startCellCoords, endCellCoords) {
    const startX = parseFloat(startCellCoords.split("-")[1]);
    const startY = parseFloat(startCellCoords.split("-")[0]);
    const endX = parseFloat(endCellCoords.split("-")[1]);
    const endY = parseFloat(endCellCoords.split("-")[0]);

    const cellSize = pxToFloat(canvas.style.width) / size;
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(
        cellSize * startX + cellSize * 0.5,
        cellSize * startY + cellSize * 0.5
    );
    ctx.lineTo(
        cellSize * endX + cellSize * 0.5,
        cellSize * endY + cellSize * 0.5
    );
    ctx.stroke();
};

const addEventsToBoard = function (words) {
    for (const cell of document.querySelectorAll("td")) {
        cell.addEventListener("click", function () {
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
                highlightedCell = this;
                // Clicked first time -> highlight current cell
                this.classList.add("highlight");
            }
        });
    }
};

const createTable = function (puzzle) {
    // Generate html to form table
    let htmlString = '<table id="playingBoard">';
    for (let x = 0; x < size; x++) {
        htmlString += `<tr>`;
        for (let y = 0; y < size; y++) {
            let letter = "-";
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
    createTable(jsonObject.puzzle);
    createWordList(jsonObject.words);
    addEventsToBoard(jsonObject.words);
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

/* init */
const init = function () {
    canvas = document.querySelector("#canvas");
    htmlGameOver = document.querySelector('.js-game-over');
    htmlRow = document.querySelector(".o-row")
    htmlBar = document.querySelector(".bar");

    setDimensions();
    getWordSearch();

    document.querySelector("#play-again").addEventListener("click", function () {
        // refresh the page
        location.reload();
    });
    document.querySelector(".close-popup").addEventListener("click", function () {
        htmlGameOver.classList.add("disabled");
    });
};

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", setDimensions);
