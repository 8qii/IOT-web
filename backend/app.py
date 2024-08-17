from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)  # Kích hoạt CORS

# API lấy 8 mẫu dữ liệu mới nhất


@app.route('/api/sensors', methods=['GET'])
def get_sensors_data():
    conn = sqlite3.connect(r'iot.db')
    cursor = conn.cursor()

    cursor.execute(
        "SELECT strftime('%H%M%S', id), nhiet_do, do_am, do_sang FROM sensors ORDER BY id DESC LIMIT 8")
    rows = cursor.fetchall()

    data = {
        'labels': [row[0] for row in rows],
        'nhiet_do': [row[1] for row in rows],
        'do_am': [row[2] for row in rows],
        'do_sang': [row[3] for row in rows]
    }

    data['labels'].reverse()
    data['nhiet_do'].reverse()
    data['do_am'].reverse()
    data['do_sang'].reverse()

    conn.close()
    return jsonify(data)

# API mới để lấy tất cả dữ liệu từ bảng sensors


@app.route('/api/sensors/all', methods=['GET'])
def get_all_sensors_data():
    conn = sqlite3.connect(r'iot.db')
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, nhiet_do, do_am, do_sang, time FROM sensors ORDER BY id ASC")
    rows = cursor.fetchall()

    data = []
    for row in rows:
        data.append({
            'id': row[0],
            'nhiet_do': row[1],
            'do_am': row[2],
            'do_sang': row[3],
            'time': row[4]  # Đảm bảo rằng thời gian được trả về đúng định dạng
        })

    conn.close()
    return jsonify(data)


@app.route('/api/devices', methods=['GET'])
def get_devices_data():
    conn = sqlite3.connect('iot.db')
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, device_name, status, timestamp FROM devices ORDER BY id DESC")
    rows = cursor.fetchall()

    data = []
    for row in rows:
        data.append({
            'id': row[0],
            'device_name': row[1],
            'status': row[2],
            'timestamp': row[3]
        })

    conn.close()
    return jsonify(data)


@app.route('/api/device-status', methods=['GET'])
def get_device_status():
    conn = sqlite3.connect('iot.db')
    cursor = conn.cursor()

    cursor.execute(
        "SELECT device_name, status FROM devices ORDER BY timestamp DESC")
    rows = cursor.fetchall()

    # Lấy trạng thái mới nhất cho mỗi thiết bị
    status_map = {}
    for row in rows:
        if row[0] not in status_map:
            status_map[row[0]] = row[1]

    conn.close()
    return jsonify(status_map)

# API để lưu trạng thái thiết bị vào cơ sở dữ liệu


@app.route('/api/update-status', methods=['POST'])
def update_status():
    data = request.json
    device_name = data['device_name']
    status = data['status']

    conn = sqlite3.connect('iot.db')
    cursor = conn.cursor()

    cursor.execute("INSERT INTO devices (device_name, status) VALUES (?, ?)",
                   (device_name, status))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Status updated successfully'})


if __name__ == '__main__':
    app.run(debug=True)
