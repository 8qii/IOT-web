from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta
import pytz


app = Flask(__name__)
CORS(app)  # Kích hoạt CORS


def get_sensor_data():
    conn = sqlite3.connect('iot.db')
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
    conn = sqlite3.connect('iot.db')
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

#-----------------------------------------------------------------------------------


@app.route('/api/device-status', methods=['GET'])
def get_device_status():
    conn = sqlite3.connect('iot.db')
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


#--------------------------notification---------------------------------------------

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    conn = sqlite3.connect('iot.db')
    cursor = conn.cursor()

    cursor.execute(
        "SELECT message, timestamp FROM notification ORDER BY id DESC LIMIT 10")
    rows = cursor.fetchall()

    notifications = [{'message': row[0], 'timestamp': row[1]} for row in rows]
    conn.close()

    return jsonify(notifications)

#------------------------------------Thong Ke-------------------------------------------

@app.route('/api/sensors/all', methods=['GET'])
def get_all_sensors_data():
    conn = sqlite3.connect(r'iot.db')
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


#----------------------------------------Lich Su-----------------------------------------
@app.route('/api/devices', methods=['GET'])
def get_devices_data():
    conn = sqlite3.connect('iot.db')
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


#------------------------------------device filter by day---------------------------------
@app.route('/api/devices-filter', methods=['GET'])
def get_devices_data_filter():
    # Nhận tham số "filter" từ query string
    filter_param = request.args.get(
        'filter', 'all')  # Giá trị mặc định là "all"

    # Kết nối tới cơ sở dữ liệu
    conn = sqlite3.connect('iot.db')
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

#-----------------------------filter sensor data------------------------------
# Đảm bảo mã API trả về dữ liệu đúng định dạng


@app.route('/api/sensors-filter', methods=['GET'])
def get_sensors_data_filter():
    # Nhận các tham số từ query string
    filter_param = request.args.get('filter', 'all')
    sensor_filter = request.args.get('sensor', 'all')
    search_query = request.args.get('search', '')

    # Kết nối tới cơ sở dữ liệu
    conn = sqlite3.connect('iot.db')
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

#-------------------------MQTT---------------------------------------------



if __name__ == '__main__':
    app.run(debug=True)
