from flask import Flask, render_template, request
import redis

app = Flask(__name__)

try:
    from bundle_config import config
    r = redis.Redis(
        host=config['redis']['host'],
        port=int(config['redis']['port']),
        password=config['redis']['password'],
    )
except ImportError:
    r = redis.Redis()

@app.route('/favicon.ico')
def favicon():
    return ""

@app.route('/new_short_url/', methods=['POST'])
def new_short_url():
    num = r.incr('max_short_url')
    r.set(num, request.form['json'])
    return baseN(num, 36)

@app.route('/<num>.json')
def num(num):
    geojson = r.get(num)
    if not geojson:
        return ""
    return geojson

@app.route('/')
@app.route('/<short_url>')
def index(short_url=None):
    num = None

    if short_url:
        num = int(short_url, 36)

    return render_template('index.html', num=num)

def baseN(num, base, numerals="0123456789abcdefghijklmnopqrstuvwxyz"):
    if num == 0:
        return "0"

    if num < 0:
        return '-' + baseN((-1) * num, base, numerals)

    if not 2 <= base <= len(numerals):
        raise ValueError('Base must be between 2-%d' % len(numerals))

    left_digits = num // base
    if left_digits == 0:
        return numerals[num % base]
    else:
        return baseN(left_digits, base, numerals) + numerals[num % base]


if __name__ == '__main__':
    app.run(debug=True)
