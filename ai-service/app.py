from flask import Flask, jsonify, request
import os
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

app = Flask(__name__)

dsn = os.environ.get("SENTRY_DSN")
if dsn:
    sentry_sdk.init(dsn=dsn, integrations=[FlaskIntegration()])

@app.get('/health')
def health():
    return jsonify({"status": "ok"})

@app.post('/advisor')
def advisor():
    payload = request.json or {}
    return jsonify({"advice": "Segment stub", "input": payload})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '5000'))
    app.run(host='0.0.0.0', port=port)
