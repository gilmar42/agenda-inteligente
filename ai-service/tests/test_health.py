import requests

def test_health_endpoint():
    # Assumes service running on localhost:5000
    try:
        res = requests.get('http://localhost:5000/health', timeout=2)
        assert res.status_code == 200
        assert res.json().get('status') == 'ok'
    except Exception as e:
        # If not running, still fail loudly to surface bug in CI/local
        raise e
