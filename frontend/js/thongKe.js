document.addEventListener('DOMContentLoaded', function () {
    let rowsPerPage = 10;  // Biến toàn cục, không cần khai báo lại bên trong sự kiện
    let currentPage = 1;
    let data = [];
    let filteredData = []; // Dữ liệu sau khi tìm kiếm
    let sortDirection = {}; // Trạng thái sắp xếp cho từng cột

    async function fetchData() {
        try {
            const response = await fetch('http://localhost:5000/api/sensors/all');
            data = await response.json();
            filteredData = data; // Ban đầu dữ liệu chưa được lọc
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

        paginatedData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${item.id !== null ? item.id : '--'}</td>
            <td>${item.nhiet_do !== null ? item.nhiet_do : '--'}</td>
            <td>${item.do_am !== null ? item.do_am : '--'}</td>
            <td>${item.do_sang !== null ? item.do_sang : '--'}</td>
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
        filteredData = data.filter(item => {
            return item.time.toLowerCase().includes(searchTerm);
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

    const headers = document.querySelectorAll('#dataTable thead th');
    headers.forEach(header => {
        header.addEventListener('click', function () {
            const column = header.getAttribute('data-sort');
            sortData(column);
        });
    });

    fetchData();

    document.getElementById('entriesSelect').addEventListener('change', function () {
        rowsPerPage = parseInt(this.value); // Cập nhật giá trị toàn cục
        currentPage = 1; // Reset lại trang
        displayData();
        setupPagination();
    });
});
