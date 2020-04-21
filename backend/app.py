import json
from flask import Flask, jsonify    # request
from flask_cors import CORS
from repositories.DataRepository import DataRepository
from models.NetflixBot import NetflixBot


# Start app
app = Flask(__name__)
CORS(app)

# Custom endpoint
endpoint = '/api/v1/'


# ROUTES
@app.route('/', methods=["GET"])
def index():
    return '<a href="http://127.0.0.1:5000/%s">api</a>' % endpoint


@app.route(endpoint+'login', methods=["GET"])
def login():
    netflix_bot = NetflixBot("charlottevdhende@gmail.com", "poelstraat14", "Simon")
    return jsonify("so far so good"), 200


# Start app
if __name__ == '__main__':
    app.run(debug=True)
