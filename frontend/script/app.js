"use strict";

// Global variables
const size = 13;
let htmlBoard;
let highlightedCell;

const addEventsToBoard = function (words) {
    console.log(words);

    for (const cell of document.querySelectorAll("td")) {
        cell.addEventListener("click", function () {
            if (highlightedCell != null) {
                // Clicked for 2nd time -> lookup word
                highlightedCell.classList.remove('highlight');

                const firstLetterX = highlightedCell.getAttribute('data-x');
                const firstLetterY = highlightedCell.getAttribute('data-y');
                const firstLetterCoords = `${firstLetterX}-${firstLetterY}`;
                console.log(firstLetterCoords);
                
                const lastLetterX = this.getAttribute('data-x');
                const lastLetterY = this.getAttribute('data-y');
                const lastLetterCoords = `${lastLetterX}-${lastLetterY}`;

                if (words.hasOwnProperty(firstLetterCoords)) {
                    if (words[firstLetterCoords].last_letter == lastLetterCoords) {
                        console.log(words[firstLetterCoords].word);
                        for(const cell of words[firstLetterCoords].all_letters) {
                            const cellX = cell.split('-')[0];
                            const cellY = cell.split('-')[1];
                            document.getElementById("playingBoard").rows[cellX].cells[cellY].classList.add('found');
                        }
                    }
                }

                highlightedCell = null;
            }   else {
                highlightedCell = this;
                // Clicked first time -> highlight current cell
                this.classList.add('highlight');
            }
        });
    }
};

const showWordSearch = function (jsonObject) {
    console.log("Showing word search");

    let htmlString = '<table id="playingBoard">';
    for (let x = 0; x < size; x++) {
        htmlString += `<tr>`;
        for (let y = 0; y < size; y++) {
            let letter = "-";
            const key = `${x}-${y}`;
            if (key in jsonObject.puzzle) {
                letter = jsonObject.puzzle[key];
            }
            htmlString += `<td data-x="${x}" data-y="${y}">${letter.toUpperCase()}</td>`;
        }
        htmlString += "</tr>";
    }
    htmlString += "</table>";

    htmlBoard.innerHTML = htmlString;
    addEventsToBoard(jsonObject.words);
};

const getWordSearch = function () {
    console.log("Getting word search");
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

/* init */
const init = function () {
    console.log("DOM Content Loaded");
    htmlBoard = document.querySelector(".js-board");

    getWordSearch();
};

document.addEventListener("DOMContentLoaded", init);
