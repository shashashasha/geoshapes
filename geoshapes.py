from flask import Flask, render_template, redirect, request
import redis, simplejson

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
    url = baseN(num, 36)
    r.set(url, request.form['json'])
    return url

@app.route('/file_upload/', methods=['POST'])
def file_upload():
    num = r.incr('max_short_url')
    url = baseN(num, 36)
    json = simplejson.dumps(simplejson.loads(request.files['file'].read()))
    r.set(url, json)
    return redirect(url)

@app.route('/<num>.json')
def num(num):
    geojson = r.get(num)
    if not geojson:
        return ""
    return geojson

@app.route('/')
@app.route('/<short_url>')
def index(short_url=None):
    return render_template('index.html', short_url=short_url)

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
