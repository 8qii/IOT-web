document.addEventListener('DOMContentLoaded', function () {
    let rowsPerPage = 10;  // Biến toàn cục, không cần khai báo lại bên trong sự kiện
    let currentPage = 1;
    let data = [];
    let filteredData = []; // Dữ liệu sau khi tìm kiếm
    let sortDirection = {}; // Trạng thái sắp xếp cho từng cột

    async function fetchData() {
        const filter = document.getElementById('filterSelect').value;
        const sensorFilter = document.getElementById('sensorFilterSelect').value;
        const searchQuery = document.getElementById('searchInput').value;

        try {
            const response = await fetch(`http://localhost:5000/api/sensors-filter?filter=${filter}&sensor=${sensorFilter}&search=${encodeURIComponent(searchQuery)}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            data = await response.json();
            filteredData = data; // Cập nhật dữ liệu đã lọc
            displayData();
            setupPagination();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    function displayData() {
        const tableBody = document.querySelector('#dataTable tbody');
        tableBody.innerHTML = '';

        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedData = filteredData.slice(start, end);

        const sensorLabels = {
            'temperature': 'Nhiệt độ',
            'humidity': 'Độ ẩm',
            'light': 'Ánh sáng'
        };

        paginatedData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${item.id !== null ? item.id : '--'}</td>
            <td>${sensorLabels[item.sensor] !== undefined ? sensorLabels[item.sensor] : '--'}</td>
            <td>${item.value !== null ? item.value : '--'}</td>
            <td>${item.time !== null ? item.time : '--'}</td>
        `;
            tableBody.appendChild(row);
        });
    }

    function setupPagination() {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        const paginationContainer = document.querySelector('#pagination');
        paginationContainer.innerHTML = '';

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

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.addEventListener('click', function () {
                currentPage = i;
                displayData();
                setupPagination();
            });

            if (i === currentPage) {
                pageButton.classList.add('active');
            }

            paginationContainer.appendChild(pageButton);
        }

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

    function filterData() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const sensorFilter = document.getElementById('sensorFilterSelect').value;

        filteredData = data.filter(item => {
            const matchesSearch = item.time.toLowerCase().includes(searchTerm);
            const matchesSensor = sensorFilter === 'all' || item.sensor === sensorFilter;
            return matchesSearch && matchesSensor;
        });

        currentPage = 1;
        displayData();
        setupPagination();
    }

    function sortData(column) {
        const direction = sortDirection[column] === 'asc' ? 'desc' : 'asc';
        sortDirection[column] = direction;

        filteredData.sort((a, b) => {
            if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
            if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        // Xóa lớp sắp xếp khỏi tất cả các cột
        document.querySelectorAll('th.sortable').forEach(header => {
            header.classList.remove('asc', 'desc');
        });

        // Thêm lớp sắp xếp vào cột hiện tại
        const header = document.querySelector(`th[data-sort="${column}"]`);
        header.classList.add(direction);

        displayData();
    }

    document.getElementById('searchInput').addEventListener('input', filterData);

    document.getElementById('sensorFilterSelect').addEventListener('change', filterData);

    const headers = document.querySelectorAll('#dataTable thead th');
    headers.forEach(header => {
        header.addEventListener('click', function () {
            const column = header.getAttribute('data-sort');
            sortData(column);
        });
    });

    document.getElementById('entriesSelect').addEventListener('change', function () {
        rowsPerPage = parseInt(this.value); // Cập nhật giá trị toàn cục
        currentPage = 1; // Reset lại trang
        displayData();
        setupPagination();
    });

    document.getElementById('filterSelect').addEventListener('change', function () {
        fetchData(); // Fetch lại dữ liệu với bộ lọc đã chọn
    });

    // Fetch dữ liệu mặc định khi tải trang
    fetchData();
});
