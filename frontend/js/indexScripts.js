window.onload = function () {
    // Fetch dữ liệu từ API
    fetch('http://127.0.0.1:5000/api/sensors')
        .then(response => response.json())
        .then(data => {
            const labels = ['7 phút', '6 phút', '5 phút', '4 phút', '3 phút', '2 phút', '1 phút', 'Hiện tại'];

            // Cập nhật biểu đồ nhiệt độ
            const tempCtx = document.getElementById('lineChart').getContext('2d');
            const lineChart = new Chart(tempCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Nhiệt độ theo phút',
                        data: data.nhiet_do,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Phút' // Tên hàng là "Phút"
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Nhiệt độ (°C)' // Tên cột là "Nhiệt độ"
                            },
                            beginAtZero: true
                        }
                    }
                }
            });

            // Cập nhật biểu đồ độ ẩm
            const humidityCtx = document.getElementById('humidityChart').getContext('2d');
            const humidityChart = new Chart(humidityCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Độ ẩm theo phút',
                        data: data.do_am,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 4,
                        pointBackgroundColor: 'rgba(54, 162, 235, 1)'
                    }]
                },
                options: {
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Phút'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Độ ẩm (%)'
                            },
                            beginAtZero: true
                        }
                    }
                }
            });

            // Cập nhật biểu đồ độ sáng
            const lightCtx = document.getElementById('lightChart').getContext('2d');
            const lightChart = new Chart(lightCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Độ sáng theo phút',
                        data: data.do_sang,
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 4,
                        pointBackgroundColor: 'rgba(255, 206, 86, 1)'
                    }]
                },
                options: {
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Phút'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Độ sáng (%)'
                            },
                            beginAtZero: true
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Error fetching sensor data:', error));
};



document.addEventListener('DOMContentLoaded', function () {
    // Lấy dữ liệu cảm biến từ API
    fetch('http://localhost:5000/api/sensors')
        .then(response => response.json())
        .then(data => {
            // Lấy dữ liệu cảm biến mới nhất
            const latestTemperature = data.nhiet_do[data.nhiet_do.length - 1];
            const latestHumidity = data.do_am[data.do_am.length - 1];
            const latestLight = data.do_sang[data.do_sang.length - 1];

            // Cập nhật các phần tử HTML với dữ liệu mới
            document.getElementById('temperature').textContent = `${latestTemperature}°C`;
            document.getElementById('humidity').textContent = `${latestHumidity}%`;
            document.getElementById('light').textContent = `${latestLight}%`;
        })
        .catch(error => console.error('Lỗi khi lấy dữ liệu cảm biến:', error));
});


document.addEventListener('DOMContentLoaded', function () {
    // Lấy trạng thái hiện tại của các thiết bị từ API
    fetch('http://localhost:5000/api/device-status')
        .then(response => response.json())
        .then(data => {
            // Cập nhật trạng thái nút cho từng thiết bị
            document.querySelectorAll('.device').forEach(device => {
                const deviceName = device.querySelector('.device-icon').alt.toLowerCase();
                const switchElement = device.querySelector('input[type="checkbox"]');
                switchElement.checked = data[deviceName] === 'on';
            });
        })
        .catch(error => console.error('Lỗi khi lấy trạng thái thiết bị:', error));

    // Gửi trạng thái mới lên API khi người dùng thay đổi trạng thái của nút
    document.querySelectorAll('.switch input[type="checkbox"]').forEach(switchElement => {
        switchElement.addEventListener('change', function () {
            const deviceElement = this.closest('.device');
            const deviceName = deviceElement.querySelector('.device-icon').alt.toLowerCase();
            const status = this.checked ? 'on' : 'off';

            fetch('http://localhost:5000/api/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    device_name: deviceName,
                    status: status
                })
            })
                .then(response => response.json())
                .then(data => {
                    console.log(data.message);
                })
                .catch(error => console.error('Lỗi khi cập nhật trạng thái thiết bị:', error));
        });
    });
});
