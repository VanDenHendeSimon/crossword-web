import json
from flask import Flask, jsonify    # request
from flask_cors import CORS
from repositories.DataRepository import DataRepository
from models.WordSearchGenerator import WordSearchGenerator


# Start app
app = Flask(__name__)
CORS(app)

# Custom endpoint
endpoint = '/api/v1/'


# ROUTES
@app.route('/', methods=["GET"])
def index():
    return jsonify(msg="so far so good"), 200


@app.route('/puzzle/<size>', methods=["GET"])
def get_puzzle(size):
    word_search = WordSearchGenerator(int(size))
    puzzle, words = word_search.generate_puzzle()

    return jsonify(puzzle=puzzle, words=words), 200


# Start app
if __name__ == '__main__':
    app.run(debug=True)
