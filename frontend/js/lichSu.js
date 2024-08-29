document.addEventListener('DOMContentLoaded', function () {
    let rowsPerPage = 10; // Mặc định là 10 hàng mỗi trang
    let currentPage = 1;
    let data = [];
    let filteredData = [];
    let sortDirection = {};

    async function fetchData() {
        try {
            const response = await fetch('http://localhost:5000/api/devices');
            data = await response.json();
            filteredData = data;
            displayData();
            setupPagination();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    function mapDeviceName(deviceName) {
        switch (deviceName) {
            case 'light':
                return 'Đèn';
            case 'ac':
                return 'Điều hòa';
            case 'fan':
                return 'Quạt thông gió';
            default:
                return deviceName;
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
                <td>${item.id}</td>
                <td>${mapDeviceName(item.device_name)}</td>
                <td>${item.status.toUpperCase()}</td>
                <td>${item.time}</td>
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
            const deviceMatch = mapDeviceName(item.device_name).toLowerCase().includes(searchTerm);
            const timeMatch = item.time.toLowerCase().includes(searchTerm);
            return deviceMatch || timeMatch;
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

    document.getElementById('entriesPerPage').addEventListener('change', function (e) {
        rowsPerPage = parseInt(e.target.value);
        currentPage = 1; // Reset lại trang
        displayData();
        setupPagination();
    });

    fetchData();
});
