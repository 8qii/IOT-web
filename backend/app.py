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
    cursor.execute(
        "SELECT temperature, humidity, light FROM sensors ORDER BY id DESC LIMIT 1")
    data = cursor.fetchone()
    conn.close()

    if data:
        return {
            "temperature": data[0] if data[0] is not None else "--",
            "humidity": data[1] if data[1] is not None else "--",
            "light": data[2] if data[2] is not None else "--"
        }
    return None


@app.route('/api/sensor_data', methods=['GET'])
def sensor_data():
    data = get_sensor_data()
    if data:
        return jsonify(data)
    return jsonify({"error": "No data found"}), 404



def get_chart_data():
    conn = sqlite3.connect('iot.db')
    cursor = conn.cursor()
    cursor.execute("""
        SELECT temperature, humidity, light 
        FROM sensors 
        ORDER BY id DESC 
        LIMIT 20
    """)
    rows = cursor.fetchall()
    conn.close()
    return rows

@app.route('/api/chart_data', methods=['GET'])
def chart_data():
    data = get_chart_data()  # Sử dụng hàm mới
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
@app.route('/api/sensors-filter', methods=['GET'])
def get_sensors_data_filter():
    # Nhận tham số "filter" từ query string
    filter_param = request.args.get(
        'filter', 'all')  # Giá trị mặc định là "all"

    # Kết nối tới cơ sở dữ liệu
    conn = sqlite3.connect('iot.db')
    cursor = conn.cursor()

    # Lấy thời gian hiện tại
    now = datetime.now()

    # Xây dựng câu truy vấn SQL và giá trị bộ lọc
    query = "SELECT id, temperature, humidity, light, time FROM sensors WHERE 1=1"
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
            'nhiet_do': row[1],
            'do_am': row[2],
            'do_sang': row[3],
            'time': row[4]
        })

    # Đóng kết nối cơ sở dữ liệu
    conn.close()

    # Trả về dữ liệu dưới dạng JSON
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
