from app import app

def test_health():
    client = app.test_client()
    res = client.get('/health')
    assert res.status_code == 200
    assert res.get_json().get('status') == 'ok'

def test_advisor():
    client = app.test_client()
    payload = {"segment": "test"}
    res = client.post('/advisor', json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data.get('advice')
    assert data.get('input') == payload
