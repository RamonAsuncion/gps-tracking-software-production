from flask import Flask, render_template, jsonify
import random

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/location')
def location():
    # Simulate a new location
    # In a real application, this would query your database or device for the current location
    lat = 37.4221 + (random.random() - 0.5) / 1000
    lng = -122.0841 + (random.random() - 0.5) / 1000
    return jsonify({'latitude': lat, 'longitude': lng})

if __name__ == '__main__':
    app.run(debug=True)
