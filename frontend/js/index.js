// Hàm cập nhật dữ liệu từ API sensor_data
function fetchSensorData() {
    fetch('http://127.0.0.1:5000/api/sensor_data')
        .then(response => response.json())
        .then(data => {
            if (!data.error) {
                updateSensorData(data.temperature, data.humidity, data.light);
            } else {
                console.error(data.error);
            }
        })
        .catch(error => console.error('Error fetching sensor data:', error));
}

// Hàm cập nhật dữ liệu cảm biến
function updateSensorData(temperature, humidity, light) {
    document.getElementById('temperature').textContent = temperature !== null ? `${temperature}°C` : '--';
    document.getElementById('humidity').textContent = humidity !== null ? `${humidity}%` : '--';
    document.getElementById('light').textContent = light !== null ? `${light} lux` : '--';
}

// Hàm cập nhật thời gian hiện tại
function updateTime() {
    const now = new Date();
    const daysOfWeek = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const day = daysOfWeek[now.getDay()];
    const date = now.getDate();
    const month = now.getMonth() + 1; // Lưu ý: getMonth() trả về chỉ số 0 cho tháng 1
    const year = now.getFullYear();

    const formattedTime = `${day}, ${date} tháng ${month} năm ${year}`;
    document.getElementById('currentTime').textContent = formattedTime;
}

// Hàm khởi tạo việc cập nhật thời gian
function startUpdatingTime() {
    updateTime(); // Gọi ngay khi trang tải
    setInterval(updateTime, 1000); // Cập nhật thời gian mỗi giây
}

// Hàm đồng bộ trạng thái thiết bị
function syncDeviceStatus() {
    fetch('http://127.0.0.1:5000/api/device-status')
        .then(response => response.json())
        .then(data => {
            const switches = document.querySelectorAll('.deviceControl .switch input');

            switches.forEach(switchElement => {
                const deviceName = switchElement.getAttribute('data-device');
                if (deviceName && data[deviceName]) {
                    switchElement.checked = data[deviceName] === 'on';
                }
            });
        })
        .catch(error => console.error('Error fetching device status:', error));
}

// Hàm khởi tạo biểu đồ
function initializeChart() {
    fetch("http://127.0.0.1:5000/api/chart_data")
        .then(response => response.json())
        .then(data => {
            const temperatures = data.map(item => item[0] !== null ? item[0] : 0);
            const humidities = data.map(item => item[1] !== null ? item[1] : 0);
            const lights = data.map(item => item[2] !== null ? item[2] : 0);

            const ctx = document.getElementById('myChart').getContext('2d');
            const myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Array.from({ length: data.length }, (_, i) => `Mốc ${i + 1}`),
                    datasets: [
                        {
                            label: 'Nhiệt độ (°C)',
                            data: temperatures,
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        },
                        {
                            label: 'Độ ẩm (%)',
                            data: humidities,
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        },
                        {
                            label: 'Ánh sáng (Lux)',
                            data: lights,
                            borderColor: 'rgba(255, 206, 86, 1)',
                            backgroundColor: 'rgba(255, 206, 86, 0.2)',
                        }
                    ]
                },
                options: {
                    animation: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Bắt đầu cập nhật dữ liệu ngay khi DOM đã tải xong
document.addEventListener("DOMContentLoaded", function () {
    fetchSensorData();
    syncDeviceStatus();
    initializeChart();
    startUpdatingTime(); // Bắt đầu cập nhật thời gian thực
});

// Tự động cập nhật dữ liệu cảm biến mỗi 60 giây
setInterval(fetchSensorData, 60000);

