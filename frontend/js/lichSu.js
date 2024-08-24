document.addEventListener('DOMContentLoaded', function () {
    const rowsPerPage = 10; // Số dòng trên mỗi trang
    let currentPage = 1; // Trang hiện tại
    let data = []; // Dữ liệu sẽ được lưu tại đây sau khi lấy từ API

    async function fetchData() {
        try {
            const response = await fetch('http://localhost:5000/api/devices');
            data = await response.json();
            displayData();
            setupPagination();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    function mapDeviceName(deviceName) {
        // Chuyển đổi tên thiết bị từ cơ sở dữ liệu thành tên hiển thị
        switch (deviceName) {
            case 'light':
                return 'Đèn';
            case 'cond':
                return 'Điều hòa';
            case 'fan':
                return 'Quạt thông gió';
            default:
                return deviceName; // Giữ nguyên nếu không có trong danh sách chuyển đổi
        }
    }

    function displayData() {
        const tableBody = document.querySelector('#dataTable tbody');
        tableBody.innerHTML = '';  // Xóa các dòng cũ nếu có

        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedData = data.slice(start, end); // Lấy dữ liệu cho trang hiện tại

        paginatedData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${mapDeviceName(item.device_name)}</td> <!-- Áp dụng chuyển đổi tên thiết bị -->
                <td>${item.status.toUpperCase()}</td>
                <td>${item.timestamp}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function setupPagination() {
        const totalPages = Math.ceil(data.length / rowsPerPage); // Tổng số trang
        const paginationContainer = document.querySelector('#pagination');
        paginationContainer.innerHTML = ''; // Xóa phân trang cũ nếu có

        // Nút trước
        const prevButton = document.createElement('button');
        prevButton.textContent = '<';
        prevButton.addEventListener('click', function () {
            if (currentPage > 1) {
                currentPage--;
                displayData();
                setupPagination();
            }
        });
        paginationContainer.appendChild(prevButton);

        // Các nút số trang
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.addEventListener('click', function () {
                currentPage = i;
                displayData();
                setupPagination();
            });

            if (i === currentPage) {
                pageButton.classList.add('active'); // Thêm class active cho trang hiện tại
            }

            paginationContainer.appendChild(pageButton);
        }

        // Nút sau
        const nextButton = document.createElement('button');
        nextButton.textContent = '>';
        nextButton.addEventListener('click', function () {
            if (currentPage < totalPages) {
                currentPage++;
                displayData();
                setupPagination();
            }
        });
        paginationContainer.appendChild(nextButton);
    }

    fetchData();
});
