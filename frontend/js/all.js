function toggleNotifications() {
    var dropdown = document.getElementById("notificationDropdown");
    if (dropdown.style.display === "none" || dropdown.style.display === "") {
        dropdown.style.display = "block";
    } else {
        dropdown.style.display = "none";
    }
}

// Đóng dropdown khi nhấp bên ngoài
window.onclick = function (event) {
    if (!event.target.matches('.notification-icon')) {
        var dropdowns = document.getElementsByClassName("notification-dropdown");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.style.display === "block") {
                openDropdown.style.display = "none";
            }
        }
    }
}

function goToProfile() {
    window.location.href = "myProfile.html";
}
