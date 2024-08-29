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

// Hàm để thay đổi hình ảnh dựa trên trạng thái của switch
function updateDeviceIcon(switchElement, iconElement, imgOn, imgOff) {
    if (switchElement && iconElement) {
        iconElement.src = switchElement.checked ? imgOn : imgOff;
    }
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

                    // Cập nhật hình ảnh tương ứng với trạng thái
                    const iconElement = document.getElementById(`${deviceName}-icon`);
                    if (deviceName === 'light') {
                        updateDeviceIcon(switchElement, iconElement, 'img/lightOn.png', 'img/lightOff.png');
                    } else if (deviceName === 'fan') {
                        updateDeviceIcon(switchElement, iconElement, 'img/fanOn.png', 'img/fanOff.png');
                    } else if (deviceName === 'ac') {
                        updateDeviceIcon(switchElement, iconElement, 'img/condOn.png', 'img/condOff.png');
                    }
                }
            });
        })
        .catch(error => console.error('Error fetching device status:', error));
}

// Gọi hàm đồng bộ trạng thái khi trang được tải
document.addEventListener('DOMContentLoaded', syncDeviceStatus);


// Hàm khởi tạo biểu đồ chính
function initializeChart() {
    fetch("http://127.0.0.1:5000/api/chart_data")
        .then(response => response.json())
        .then(data => {
            const temperatures = data.map(item => item[0] !== null ? item[0] : 0);
            const humidities = data.map(item => item[1] !== null ? item[1] : 0);
            const lights = data.map(item => item[2] !== null ? item[2] : 0);

            const ctx = document.getElementById('myChart').getContext('2d');
            new Chart(ctx, {
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

// Hàm khởi tạo biểu đồ chi tiết khi cửa sổ chi tiết mở
function initializeDetailedCharts() {
    fetch("http://127.0.0.1:5000/api/chart_data")
        .then(response => response.json())
        .then(data => {
            const temperatures = data.map(item => item[0] !== null ? item[0] : 0);
            const humidities = data.map(item => item[1] !== null ? item[1] : 0);
            const lights = data.map(item => item[2] !== null ? item[2] : 0);

            // Biểu đồ nhiệt độ chi tiết
            const tempCtx = document.getElementById('lineChart').getContext('2d');
            new Chart(tempCtx, {
                type: 'line',
                data: {
                    labels: Array.from({ length: data.length }, (_, i) => `Mốc ${i + 1}`),
                    datasets: [{
                        label: 'Nhiệt độ (°C)',
                        data: temperatures,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    }]
                },
                options: {
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });

            // Biểu đồ độ ẩm chi tiết
            const humidityCtx = document.getElementById('humidityChart').getContext('2d');
            new Chart(humidityCtx, {
                type: 'line',
                data: {
                    labels: Array.from({ length: data.length }, (_, i) => `Mốc ${i + 1}`),
                    datasets: [{
                        label: 'Độ ẩm (%)',
                        data: humidities,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    }]
                },
                options: {
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });

            // Biểu đồ ánh sáng chi tiết
            const lightCtx = document.getElementById('lightChart').getContext('2d');
            new Chart(lightCtx, {
                type: 'line',
                data: {
                    labels: Array.from({ length: data.length }, (_, i) => `Mốc ${i + 1}`),
                    datasets: [{
                        label: 'Ánh sáng (Lux)',
                        data: lights,
                        borderColor: 'rgba(255, 206, 86, 1)',
                        backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    }]
                },
                options: {
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        })
        .catch(error => console.error('Error fetching data:', error));
}

function updateCardColors() {
    const temperature = parseFloat(document.getElementById('temperature').textContent);
    const humidity = parseFloat(document.getElementById('humidity').textContent);
    const light = parseFloat(document.getElementById('light').textContent);

    updateCardColor('temperature', temperature, [15, 30, 40], 'temperature');
    updateCardColor('humidity', humidity, [30, 70, 80], 'humidity');
    updateCardColor('light', light, [200, 700, 1000], 'light');
}

function updateCardColor(id, value, thresholds, type) {
    const card = document.getElementById(id).closest('.card');
    card.classList.remove(`${type}-low`, `${type}-medium`, `${type}-high`);

    if (value <= thresholds[0]) {
        card.classList.add(`${type}-low`);
    } else if (value > thresholds[0] && value <= thresholds[1]) {
        card.classList.add(`${type}-medium`);
    } else {
        card.classList.add(`${type}-high`);
    }
}


// Giả sử bạn cập nhật dữ liệu mỗi giây
setInterval(() => {
    // Hàm này nên được gọi sau khi cập nhật giá trị nhiệt độ, độ ẩm, và độ sáng
    updateCardColors();
}, 1);



document.addEventListener("DOMContentLoaded", function () {
    fetchSensorData();
    syncDeviceStatus();
    initializeChart();
    startUpdatingTime(); // Bắt đầu cập nhật thời gian thực

    // Gán sự kiện cho nút chi tiết và đóng cửa sổ chi tiết
    document.getElementById('detailButton').addEventListener('click', function () {
        document.getElementById('detailChartModal').style.display = 'flex';
        initializeDetailedCharts(); // Khởi tạo biểu đồ chi tiết khi cửa sổ mở
    });

    document.getElementById('closeButton').addEventListener('click', function () {
        document.getElementById('detailChartModal').style.display = 'none';
    });
    // Đóng modal khi nhấp vào vùng nền ngoài modal
    document.getElementById('detailChartModal').addEventListener('click', function (event) {
        if (event.target === this) {
            this.style.display = 'none';
        }
    });
});

// Tự động cập nhật dữ liệu cảm biến mỗi 60 giây
setInterval(fetchSensorData, 60000);

document.addEventListener("DOMContentLoaded", function () {
    // Lấy các phần tử switch và ảnh tương ứng
    const lightSwitch = document.getElementById('light-switch');
    const fanSwitch = document.getElementById('fan-switch');
    const acSwitch = document.getElementById('ac-switch');

    const lightIcon = document.getElementById('light-icon');
    const fanIcon = document.getElementById('fan-icon');
    const acIcon = document.getElementById('ac-icon');

    // Hàm để thay đổi hình ảnh dựa trên trạng thái của switch
    function updateDeviceIcon(switchElement, iconElement, imgOn, imgOff) {
        if (switchElement.checked) {
            iconElement.src = imgOn;
        } else {
            iconElement.src = imgOff;
        }
    }

    // Thêm sự kiện cho từng switch
    lightSwitch.addEventListener('change', function () {
        updateDeviceIcon(lightSwitch, lightIcon, 'img/lightOn.png', 'img/lightOff.png');
    });

    fanSwitch.addEventListener('change', function () {
        updateDeviceIcon(fanSwitch, fanIcon, 'img/fanOn.png', 'img/fanOff.png');
    });

    acSwitch.addEventListener('change', function () {
        updateDeviceIcon(acSwitch, acIcon, 'img/condOn.png', 'img/condOff.png');
    });
});
