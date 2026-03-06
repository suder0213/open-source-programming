#app.py

from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return "Welcome to My Development Journal API!"

@app.route('/extra')
def entries():
    return "It's extra page"

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)