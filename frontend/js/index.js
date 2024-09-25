function fetchSensorData() {
    fetch('http://127.0.0.1:5000/api/sensor_data')
        .then(response => response.json())
        .then(data => {
            if (!data.error) {
                updateSensorData(data.temperature, data.humidity, data.light);

                // Kiểm tra các điều kiện sau khi cập nhật dữ liệu cảm biến
                checkConditions(data.temperature, data.humidity, data.light);

                // Cập nhật lại biểu đồ sau khi cập nhật dữ liệu cảm biến
                updateChartData(data.temperature, data.humidity, data.light);
            } else {
                console.error(data.error);
            }
        })
        .catch(error => console.error('Error fetching sensor data:', error));
}

// Hàm cập nhật dữ liệu biểu đồ
function updateChartData(newTemperature, newHumidity, newLight) {
    // Cập nhật dữ liệu cho các dataset của biểu đồ
    const chart = Chart.getChart('myChart'); // Lấy đối tượng biểu đồ bằng id 'myChart'
    if (chart) {
        chart.data.datasets[0].data.push(newTemperature);
        chart.data.datasets[1].data.push(newHumidity);
        chart.data.datasets[2].data.push(newLight);

        // Xóa các giá trị cũ nếu vượt quá giới hạn (ví dụ: chỉ giữ 15 giá trị cuối cùng)
        if (chart.data.datasets[0].data.length > 15) {
            chart.data.datasets[0].data.shift();
            chart.data.datasets[1].data.shift();
            chart.data.datasets[2].data.shift();
        }

        // Cập nhật lại biểu đồ
        chart.update();
    }
}

// Biến để theo dõi thiết bị nào được bật
let deviceToToggle = null;

// Hàm để hiển thị thông báo với hiệu ứng
function showNotification(message, device) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    const toggleIcon = document.getElementById('toggleIcon');

    notificationMessage.textContent = message;
    notification.style.opacity = 0;
    notification.style.visibility = 'visible';

    // Đặt thiết bị nào cần bật
    deviceToToggle = device; // Lưu thiết bị vào biến

    // Khởi động hiệu ứng fade-in
    setTimeout(() => {
        notification.style.opacity = 1;
    }, 50);

    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
        notification.style.opacity = 0;
        setTimeout(() => {
            notification.style.visibility = 'hidden';
        }, 500);
    }, 3000);

    // Thêm sự kiện nhấp cho biểu tượng
    toggleIcon.onclick = function () {
        toggleDevice(deviceToToggle); // Gọi hàm toggleDevice khi nhấp
    };
}


// Hàm để bật/ tắt thiết bị (chuyển trạng thái công tắc)
function toggleDevice(device) {
    switch (device) {
        case 'air_conditioner':
            // Chuyển đổi trạng thái công tắc điều hòa
            const acSwitch = document.getElementById('ac-switch');
            acSwitch.checked = true; // Bật công tắc điều hòa
            controlDevice("ac", "on");
            break;
        case 'fan':
            // Chuyển đổi trạng thái công tắc quạt
            const fanSwitch = document.getElementById('fan-switch');
            fanSwitch.checked = true; // Bật công tắc quạt
            controlDevice("fan", "on");
            break;
        case 'light':
            // Chuyển đổi trạng thái công tắc đèn
            const lightSwitch = document.getElementById('light-switch');
            lightSwitch.checked = true; // Bật công tắc đèn
            controlDevice("light", "on");
            break;
        default:
            console.log("Không xác định thiết bị");
    }
}

// Hàm kiểm tra điều kiện và hiển thị thông báo tương ứng
function checkConditions(temperature, humidity, light) {
    const lightSwitch = document.getElementById('light-switch'); 
    if (temperature > 35) {
        showNotification("Nhiệt độ cao! Bạn có muốn bật điều hòa không?", 'air_conditioner');
    }

    if (humidity > 85) {
        showNotification("Độ ẩm cao! Bạn có muốn bật quạt không?", 'fan');
    }

    if (light < 1000 && !lightSwitch.checked) {
        showNotification("Ánh sáng yếu! Bạn có muốn bật đèn không?", 'light');
    }
}

function updateSensorData(temperature, humidity, light) {
    document.getElementById('temperature').textContent = temperature !== null ? `${temperature}°C` : '--';
    document.getElementById('humidity').textContent = humidity !== null ? `${humidity}%` : '--';
    document.getElementById('light').textContent = light !== null ? `${light} lux` : '--';
}

function controlDevice(device, status) {
    // Gửi yêu cầu điều khiển thiết bị
    fetch('http://127.0.0.1:5000/api/control-device', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            device: device,
            status: status
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`${device} is now ${status}`);
                const switchElement = document.querySelector(`[data-device="${device}"]`);
                const iconElement = document.getElementById(`${device}-icon`);

                // Cập nhật hình ảnh thiết bị
                if (device === 'light') {
                    updateDeviceIcon(switchElement, iconElement, 'img/lightOn.png', 'img/lightOff.png');
                } else if (device === 'fan') {
                    updateDeviceIcon(switchElement, iconElement, 'img/fanOn.png', 'img/fanOff.png');
                } else if (device === 'ac') {
                    updateDeviceIcon(switchElement, iconElement, 'img/condOn.png', 'img/condOff.png');
                }


                // Gửi thông báo sau khi cập nhật thành công
                let message = "";
                switch (device) {
                    case 'light':
                        message = status === 'on' ? "Đèn đã được bật" : "Đèn đã được tắt";
                        break;
                    case 'fan':
                        message = status === 'on' ? "Quạt đã được bật" : "Quạt đã được tắt";
                        break;
                    case 'ac':
                        message = status === 'on' ? "Điều hòa đã được bật" : "Điều hòa đã được tắt";
                        break;
                }

                sendNotification(message);  // Gọi hàm để gửi thông báo

            } else {
                console.error('Error updating device');
            }
        });
}

// Hàm gửi thông báo qua API
function sendNotification(message) {
    fetch('http://127.0.0.1:5000/api/add-notification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("Thông báo đã được gửi: " + message);
            } else {
                console.error("Lỗi khi gửi thông báo: " + data.error);
            }
        })
        .catch(error => {
            console.error("Lỗi kết nối khi gửi thông báo:", error);
        });
}


// Hàm cập nhật thời gian hiện tại
function updateTime() {
    const now = new Date();
    const daysOfWeek = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const day = daysOfWeek[now.getDay()];
    const date = now.getDate();
    const month = now.getMonth() + 1; // Lưu ý: getMonth() trả về chỉ số 0 cho tháng 1
    const year = now.getFullYear();

    const hours = String(now.getHours()).padStart(2, '0'); // Đảm bảo giờ có 2 chữ số
    const minutes = String(now.getMinutes()).padStart(2, '0'); // Đảm bảo phút có 2 chữ số
    const seconds = String(now.getSeconds()).padStart(2, '0'); // Đảm bảo giây có 2 chữ số

    const formattedTime = `${hours}:${minutes}:${seconds} - ${day}, ${date} tháng ${month} năm ${year}`;
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

// Hàm thêm sự kiện cho các nút bật/tắt thiết bị
document.querySelectorAll('.switch input').forEach((switchElement) => {
    switchElement.addEventListener('change', function () {
        const device = this.getAttribute('data-device');
        const status = this.checked ? 'on' : 'off';

        // Tắt hoạt ảnh ngay khi bấm công tắc
        const switchElement = this.closest('.switch');
        switchElement.classList.add('no-transition');

        // Gửi yêu cầu AJAX đến Flask server
        fetch('http://127.0.0.1:5000/api/control-device', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                device: device,
                status: status
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log(`${device} is now ${status}`);
                    updateDeviceIcon(device, status); // Cập nhật hình ảnh thiết bị sau khi nhận phản hồi thành công
                    // Gửi thông báo khi thiết bị được bật/tắt
                    let message = "";
                    switch (device) {
                        case 'light':
                            message = status === 'on' ? "Đèn đã được bật" : "Đèn đã được tắt";
                            break;
                        case 'fan':
                            message = status === 'on' ? "Quạt đã được bật" : "Quạt đã được tắt";
                            break;
                        case 'ac':
                            message = status === 'on' ? "Điều hòa đã được bật" : "Điều hòa đã được tắt";
                            break;
                        default:
                            message = "Thiết bị không xác định";
                    }

                    // Gọi API gửi thông báo
                    sendNotification(message);
                } else {
                    console.error('Error updating device');
                }
            });
    });
});

// Hàm khởi tạo biểu đồ chính
function initializeChart() {
    fetch("http://127.0.0.1:5000/api/chart_data")
        .then(response => response.json())
        .then(data => {
            const temperatures = data.map(item => item[0] !== null ? item[0] : 0);
            const humidities = data.map(item => item[1] !== null ? item[1] : 0);
            const lights = data.map(item => item[2] !== null ? item[2] : 0);

            const ctx = document.getElementById('myChart').getContext('2d');
            // Cấu hình nhãn trục x
            const xAxisLabels = Array.from({ length: data.length }, (_, i) => {
                if (i === 4) return '15';
                if (i === 9) return '10';
                if (i === 14) return '5';
                if (i === 19) return 'Hiện tại';
                return '';
            });
            new Chart(ctx, {
                type: 'line',
                data: {
                    // Sử dụng nhãn rỗng ban đầu
                    labels: Array.from({ length: data.length }, () => ''),
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
                        x: {
                            ticks: {
                                autoSkip: false,
                                maxRotation: 0,
                                minRotation: 0,
                                callback: function (value, index, values) {
                                    // Hiển thị nhãn theo giá trị của chỉ số
                                    return xAxisLabels[index];
                                }
                            },
                            grid: {
                                display: true,
                                drawOnChartArea: true
                            },
                            title: {
                                display: true,
                                text: 'Phút'
                            },
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 5,
                                maxTicksLimit: 20,
                            }
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

            // Cấu hình nhãn trục x
            const xAxisLabels = Array.from({ length: data.length }, (_, i) => {
                if (i === 4) return '15';
                if (i === 9) return '10';
                if (i === 14) return '5';
                if (i === 19) return 'Hiện tại';
                return '';
            });

            // Biểu đồ nhiệt độ chi tiết
            const tempCtx = document.getElementById('lineChart').getContext('2d');
            new Chart(tempCtx, {
                type: 'line',
                data: {
                    labels: xAxisLabels,
                    datasets: [{
                        label: 'Nhiệt độ (°C)',
                        data: temperatures,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    }]
                },
                options: {
                    scales: {
                        x: {
                            ticks: {
                                autoSkip: false, // Không tự động bỏ qua nhãn
                                maxRotation: 0,
                                minRotation: 0,
                                callback: function (value, index, values) {
                                    // Hiển thị nhãn theo giá trị của chỉ số
                                    return xAxisLabels[index];
                                }
                            },
                            grid: {
                                display: true,
                                drawOnChartArea: true
                            },
                            title: {
                                display: true,
                                text: 'Phút'
                            },
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 5,
                                maxTicksLimit: 20,
                            }
                        }
                    }
                }
            });

            // Biểu đồ độ ẩm chi tiết
            const humidityCtx = document.getElementById('humidityChart').getContext('2d');
            new Chart(humidityCtx, {
                type: 'line',
                data: {
                    labels: xAxisLabels,
                    datasets: [{
                        label: 'Độ ẩm (%)',
                        data: humidities,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    }]
                },
                options: {
                    scales: {
                        x: {
                            ticks: {
                                autoSkip: false,
                                maxRotation: 0,
                                minRotation: 0,
                                callback: function (value, index, values) {
                                    // Hiển thị nhãn theo giá trị của chỉ số
                                    return xAxisLabels[index];
                                }
                            },
                            grid: {
                                display: true,
                                drawOnChartArea: true
                            },
                            title: {
                                display: true,
                                text: 'Phút'
                            },
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 5,
                                maxTicksLimit: 20,
                            }
                        }
                    }
                }
            });

            // Biểu đồ ánh sáng chi tiết
            const lightCtx = document.getElementById('lightChart').getContext('2d');
            new Chart(lightCtx, {
                type: 'line',
                data: {
                    labels: xAxisLabels,
                    datasets: [{
                        label: 'Ánh sáng (Lux)',
                        data: lights,
                        borderColor: 'rgba(255, 206, 86, 1)',
                        backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    }]
                },
                options: {
                    scales: {
                        x: {
                            ticks: {
                                autoSkip: false,
                                maxRotation: 0,
                                minRotation: 0,
                                callback: function (value, index, values) {
                                    // Hiển thị nhãn theo giá trị của chỉ số
                                    return xAxisLabels[index];
                                }
                            },
                            grid: {
                                display: true,
                                drawOnChartArea: true
                            },
                            title: {
                                display: true,
                                text: 'Phút'
                            },
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 5,
                                maxTicksLimit: 20,
                            }
                        }
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

    updateCardColor('temperature', temperature, [15, 25, 40], 'temperature');
    updateCardColor('humidity', humidity, [30, 70, 80], 'humidity');
    updateCardColor('light', light, [1000, 3000, 5000], 'light');
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
setInterval(fetchSensorData, 5000);

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


// Hàm để khởi động cập nhật tự động mỗi giây
function startAutoUpdate() {
    fetchDeviceStatus(); // Lần đầu tiên lấy trạng thái thiết bị
    setInterval(fetchDeviceStatus, 500); // Cập nhật mỗi 5 giây
}

// Khởi động tự động cập nhật khi trang web được tải
window.onload = startAutoUpdate;
