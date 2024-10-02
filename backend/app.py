import random
from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta
import pytz
import json
import paho.mqtt.client as mqtt

app = Flask(__name__)
CORS(app)  # Kích hoạt CORS


def get_sensor_data():
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()

    # Truy vấn để lấy giá trị mới nhất của mỗi cảm biến
    cursor.execute("""
        SELECT sensor, value, time 
        FROM sensors 
        WHERE id IN (
            SELECT MAX(id) 
            FROM sensors 
            WHERE sensor IN ('temperature', 'humidity', 'light') 
            GROUP BY sensor
        )
    """)

    rows = cursor.fetchall()
    conn.close()

    # Tạo từ điển để lưu trữ kết quả
    data = {"temperature": "--", "humidity": "--", "light": "--"}

    for row in rows:
        sensor, value, _ = row
        data[sensor] = value

    return data if rows else None


@app.route('/api/sensor_data', methods=['GET'])
def sensor_data():
    data = get_sensor_data()
    if data:
        return jsonify(data)
    return jsonify({"error": "No data found"}), 404


def get_chart_data():
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()

    # Truy vấn để lấy 20 mẫu dữ liệu mới nhất của mỗi loại cảm biến
    cursor.execute("""
        SELECT value 
        FROM sensors 
        WHERE sensor = 'temperature' 
        ORDER BY id DESC 
        LIMIT 20
    """)
    temperatures = cursor.fetchall()

    cursor.execute("""
        SELECT value 
        FROM sensors 
        WHERE sensor = 'humidity' 
        ORDER BY id DESC 
        LIMIT 20
    """)
    humidities = cursor.fetchall()

    cursor.execute("""
        SELECT value 
        FROM sensors 
        WHERE sensor = 'light' 
        ORDER BY id DESC 
        LIMIT 20
    """)
    lights = cursor.fetchall()

    conn.close()

    # Chuẩn bị dữ liệu trả về dưới dạng danh sách của các danh sách
    data = list(zip(temperatures, humidities, lights))

    # Chuyển đổi từ list các tuple về dạng list của list cho đúng với JS logic
    data = [[temp[0], hum[0], light[0]] for temp, hum, light in data]

    return data


@app.route('/api/chart_data', methods=['GET'])
def chart_data():
    data = get_chart_data()
    return jsonify(data)

# -----------------------------------------------------------------------------------


@app.route('/api/device-status', methods=['GET'])
def get_device_status():
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()

    cursor.execute(
        "SELECT device_name, status FROM devices ORDER BY time DESC")
    rows = cursor.fetchall()

    # Lấy trạng thái mới nhất cho mỗi thiết bị
    status_map = {}
    for row in rows:
        if row[0] not in status_map:
            status_map[row[0]] = row[1]

    conn.close()
    return jsonify(status_map)


# --------------------------notification---------------------------------------------

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()

    cursor.execute(
        "SELECT message, timestamp FROM notification ORDER BY id DESC LIMIT 10")
    rows = cursor.fetchall()

    notifications = [{'message': row[0], 'timestamp': row[1]} for row in rows]
    conn.close()

    return jsonify(notifications)


def add_notification(message):
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO notification (message) VALUES (?)", (message,))
    conn.commit()
    conn.close()


@app.route('/api/add-notification', methods=['POST'])
def add_notification_route():
    data = request.get_json()
    message = data.get('message')

    if message:
        add_notification(message)
        return jsonify({'success': True}), 200
    else:
        return jsonify({'success': False, 'error': 'No message provided'}), 400

# ------------------------------------Thong Ke-------------------------------------------


@app.route('/api/sensors/all', methods=['GET'])
def get_all_sensors_data():
    conn = sqlite3.connect(r'G:/Coding/database/iot.db')
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, temperature, humidity, light, time FROM sensors ORDER BY id ASC")
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


# ----------------------------------------Lich Su-----------------------------------------
@app.route('/api/devices', methods=['GET'])
def get_devices_data():
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, device_name, status, time FROM devices ORDER BY id DESC")
    rows = cursor.fetchall()

    data = []
    for row in rows:
        data.append({
            'id': row[0],
            'device_name': row[1],
            'status': row[2],
            'time': row[3]
        })

    conn.close()
    return jsonify(data)


# ------------------------------------device filter by day---------------------------------
@app.route('/api/devices-filter', methods=['GET'])
def get_devices_data_filter():
    # Nhận tham số "filter" từ query string
    filter_param = request.args.get(
        'filter', 'all')  # Giá trị mặc định là "all"

    # Kết nối tới cơ sở dữ liệu
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()

    # Lấy thời gian hiện tại
    now = datetime.now()

    # Xây dựng câu truy vấn SQL và giá trị bộ lọc
    query = "SELECT id, device_name, status, time FROM devices WHERE 1=1"
    params = []

    if filter_param == 'today':
        # Lọc cho dữ liệu của ngày hôm nay
        start_date = now.strftime('%Y-%m-%d 00:00:00')
        end_date = now.strftime('%Y-%m-%d 23:59:59')
        query += " AND time BETWEEN ? AND ?"
        params.extend([start_date, end_date])

    elif filter_param == '7days':
        # Lọc cho dữ liệu trong 7 ngày qua
        start_date = (now - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')
        query += " AND time >= ?"
        params.append(start_date)

    elif filter_param == '1month':
        # Lọc cho dữ liệu trong 1 tháng qua
        start_date = (now - timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
        query += " AND time >= ?"
        params.append(start_date)

    elif filter_param == '3months':
        # Lọc cho dữ liệu trong 3 tháng qua
        start_date = (now - timedelta(days=90)).strftime('%Y-%m-%d %H:%M:%S')
        query += " AND time >= ?"
        params.append(start_date)

    # Sắp xếp theo thời gian mới nhất trước
    query += " ORDER BY time DESC"

    # Thực hiện truy vấn
    cursor.execute(query, params)
    rows = cursor.fetchall()

    # Định dạng dữ liệu kết quả thành danh sách các dictionary
    data = []
    for row in rows:
        data.append({
            'id': row[0],
            'device_name': row[1],
            'status': row[2],
            'time': row[3]
        })

    # Đóng kết nối cơ sở dữ liệu
    conn.close()

    # Trả về dữ liệu dưới dạng JSON
    return jsonify(data)

# -----------------------------filter sensor data------------------------------
# Đảm bảo mã API trả về dữ liệu đúng định dạng


@app.route('/api/sensors-filter', methods=['GET'])
def get_sensors_data_filter():
    # Nhận các tham số từ query string
    filter_param = request.args.get('filter', 'all')
    sensor_filter = request.args.get('sensor', 'all')
    search_query = request.args.get('search', '')

    # Kết nối tới cơ sở dữ liệu
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()

    # Lấy thời gian hiện tại
    now = datetime.now()

    # Xây dựng câu truy vấn SQL và giá trị bộ lọc
    query = "SELECT id, sensor, value, time FROM sensors WHERE 1=1"
    params = []

    if filter_param == 'today':
        # Lọc cho dữ liệu của ngày hôm nay
        start_date = now.strftime('%Y-%m-%d 00:00:00')
        end_date = now.strftime('%Y-%m-%d 23:59:59')
        query += " AND time BETWEEN ? AND ?"
        params.extend([start_date, end_date])

    elif filter_param == '7days':
        # Lọc cho dữ liệu trong 7 ngày qua
        start_date = (now - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')
        query += " AND time >= ?"
        params.append(start_date)

    elif filter_param == '1month':
        # Lọc cho dữ liệu trong 1 tháng qua
        start_date = (now - timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
        query += " AND time >= ?"
        params.append(start_date)

    elif filter_param == '3months':
        # Lọc cho dữ liệu trong 3 tháng qua
        start_date = (now - timedelta(days=90)).strftime('%Y-%m-%d %H:%M:%S')
        query += " AND time >= ?"
        params.append(start_date)

    if sensor_filter != 'all':
        query += " AND sensor = ?"
        params.append(sensor_filter)

    if search_query:
        query += " AND time LIKE ?"
        params.append(f'%{search_query}%')

    # Sắp xếp theo thời gian mới nhất trước
    query += " ORDER BY time DESC"

    # Thực hiện truy vấn
    cursor.execute(query, params)
    rows = cursor.fetchall()

    # Định dạng dữ liệu kết quả thành danh sách các dictionary
    data = []
    for row in rows:
        data.append({
            'id': row[0],
            'sensor': row[1],
            'value': row[2],
            'time': row[3]
        })

    # Đóng kết nối cơ sở dữ liệu
    conn.close()

    # Trả về dữ liệu dưới dạng JSON
    return jsonify(data)


# -------------------------MQTT---------------------------------------------
# Cấu hình MQTT
mqtt_broker = "172.20.10.3"  # Địa chỉ IP của máy nhận MQTT
mqtt_port = 1884
mqtt_topic = "home/sensor/data"
mqtt_topic_control = "home/device/control"  # Chủ đề điều khiển thiết bị
mqtt_topic_status = "home/device/status"  # Chủ đề cập nhật trạng thái thiết bị

mqtt_user = "quan"  # Username cho MQTT
mqtt_password = "b21dccn606"  # Password cho MQTT

# Hàm callback khi có tin nhắn từ MQTT


def on_message(client, userdata, message):
    try:
        print(f"Received message: {message.payload.decode()}")

        if message.topic == mqtt_topic:
            payload = json.loads(message.payload.decode())
            temperature = payload.get('temperature')
            humidity = payload.get('humidity')
            light = payload.get('light')

            conn = sqlite3.connect('G:/Coding/database/iot.db')
            cursor = conn.cursor()

            if temperature is not None:
                cursor.execute(
                    "INSERT INTO sensors (sensor, value) VALUES (?, ?)", ('temperature', temperature))
            if humidity is not None:
                cursor.execute(
                    "INSERT INTO sensors (sensor, value) VALUES (?, ?)", ('humidity', humidity))
            if light is not None:
                cursor.execute(
                    "INSERT INTO sensors (sensor, value) VALUES (?, ?)", ('light', light))

            conn.commit()
            conn.close()

            print("Dữ liệu cảm biến đã được lưu vào cơ sở dữ liệu")

        elif message.topic == mqtt_topic_status:
            payload = json.loads(message.payload.decode())
            device = payload.get('device')
            status = payload.get('status')

            conn = sqlite3.connect('G:/Coding/database/iot.db')
            cursor = conn.cursor()

            if device is not None and status is not None:
                cursor.execute(
                    "INSERT INTO devices (device_name, status) VALUES (?, ?)", (device, status))

            conn.commit()
            conn.close()

            print(f"Trạng thái thiết bị {
                  device} đã được cập nhật thành {status}")

    except Exception as e:
        print(f"Error while processing message: {e}")


# Khởi tạo MQTT client và cấu hình callback
mqtt_client = mqtt.Client()
mqtt_client.on_message = on_message

# Thêm thông tin đăng nhập MQTT
mqtt_client.username_pw_set(mqtt_user, mqtt_password)


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Kết nối thành công đến MQTT broker")
        client.subscribe(mqtt_topic)
        client.subscribe(mqtt_topic_status)
    else:
        print(f"Kết nối thất bại với mã lỗi: {rc}")


mqtt_client.on_connect = on_connect

# ---------------------- Flask API cho điều khiển thiết bị ----------------------


@app.route('/api/control-device', methods=['POST'])
def control_device():
    try:
        data = request.get_json()
        device = data.get('device')
        status = data.get('status')

        if not device or not status:
            return jsonify({'success': False, 'message': 'Thiếu thông tin thiết bị hoặc trạng thái'})

        mqtt_payload = json.dumps({
            'device': device,
            'status': status
        })
        mqtt_client.publish(mqtt_topic_control, mqtt_payload)

        return jsonify({'success': True, 'message': f'{device} is now {status}'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Lỗi: {str(e)}'})


# Chạy Flask server
if __name__ == '__main__':
    mqtt_client.connect(mqtt_broker, mqtt_port)
    mqtt_client.subscribe(mqtt_topic)
    mqtt_client.subscribe(mqtt_topic_status)

    mqtt_client.loop_start()
    app.run(debug=True)
