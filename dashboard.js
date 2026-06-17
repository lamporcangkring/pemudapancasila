/* --------------------------------------------------
   LSM Pemuda Pancasila - Dashboard Javascript
   Data rendering, approvals, search, and tab controls
-------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Guard check (Extra client-side check)
    if (sessionStorage.getItem('admin_logged_in') !== 'true') {
        window.location.replace('login.html');
        return;
    }

    // 2. Global Theme Toggle Support
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('i');
    
    const applyTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            themeIcon.className = 'fa-solid fa-moon';
        } else {
            document.body.classList.remove('light-theme');
            themeIcon.className = 'fa-solid fa-sun';
        }
    };
    applyTheme();

    themeToggle.addEventListener('click', () => {
        if (document.body.classList.contains('light-theme')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
        applyTheme();
    });

    // 3. Sidebar Navigation Switcher
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    const views = document.querySelectorAll('.dashboard-view');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute('data-tab');

            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');

            views.forEach(v => {
                v.classList.remove('active-view');
                if (v.getAttribute('id') === `view-${targetTab}`) {
                    v.classList.add('active-view');
                }
            });
        });
    });

    // Handle "Kembali ke Overview" button in the secondary Members view
    const gotoOverviewBtn = document.querySelector('.btn-goto-overview');
    if (gotoOverviewBtn) {
        gotoOverviewBtn.addEventListener('click', () => {
            const overviewMenu = document.querySelector('.sidebar-menu .menu-item[data-tab="overview"]');
            if (overviewMenu) overviewMenu.click();
        });
    }

    // 4. Data Load, Render & Calculations
    const tableBody = document.getElementById('memberTableBody');
    const searchInput = document.getElementById('searchMember');
    const provinceFilter = document.getElementById('filterProvinsi');

    // Stat HTML elements
    const statTotalEl = document.getElementById('statTotal');
    const statApprovedEl = document.getElementById('statApproved');
    const statPendingEl = document.getElementById('statPending');
    const statRejectedEl = document.getElementById('statRejected');

    const getMembers = () => {
        return JSON.parse(localStorage.getItem('pp_members')) || [];
    };

    const saveMembers = (members) => {
        localStorage.setItem('pp_members', JSON.stringify(members));
    };

    const calculateStats = (members) => {
        const total = members.length;
        const approved = members.filter(m => m.status === 'Disetujui').length;
        const pending = members.filter(m => m.status === 'Pending').length;
        const rejected = members.filter(m => m.status === 'Ditolak').length;

        statTotalEl.textContent = total;
        statApprovedEl.textContent = approved;
        statPendingEl.textContent = pending;
        statRejectedEl.textContent = rejected;
    };

    const renderTable = () => {
        const allMembers = getMembers();
        calculateStats(allMembers);

        const query = searchInput.value.toLowerCase().trim();
        const selectedProvince = provinceFilter.value;

        // Apply filters
        const filteredMembers = allMembers.filter(m => {
            const matchesQuery = m.fullName.toLowerCase().includes(query) || m.id.toLowerCase().includes(query);
            const matchesProvince = selectedProvince === '' || m.provinsi === selectedProvince;
            return matchesQuery && matchesProvince;
        });

        tableBody.innerHTML = '';

        if (filteredMembers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4 text-muted">
                        <i class="fa-solid fa-triangle-exclamation"></i> Tidak ada pendaftar yang cocok dengan pencarian Anda.
                    </td>
                </tr>
            `;
            return;
        }

        // Render each row
        filteredMembers.forEach(m => {
            const tr = document.createElement('tr');
            
            // Status Badge styling class
            let badgeClass = 'badge-pending';
            if (m.status === 'Disetujui') badgeClass = 'badge-approved';
            if (m.status === 'Ditolak') badgeClass = 'badge-rejected';

            tr.innerHTML = `
                <td class="font-heading font-bold">${m.id}</td>
                <td><strong>${m.fullName}</strong></td>
                <td>${m.email}</td>
                <td>
                    <a href="https://wa.me/${m.phone.replace(/[^0-9]/g, '')}" target="_blank" class="wa-chat-link">
                        <i class="fa-brands fa-whatsapp text-green"></i> ${m.phone}
                    </a>
                </td>
                <td>${m.provinsi}</td>
                <td>${m.date}</td>
                <td class="table-reason-cell" title="${m.reason}">${m.reason}</td>
                <td><span class="status-badge ${badgeClass}">${m.status}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn-action btn-approve" title="Setujui Anggota" data-id="${m.id}" ${m.status === 'Disetujui' ? 'disabled' : ''}>
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button class="btn-action btn-reject" title="Tolak Anggota" data-id="${m.id}" ${m.status === 'Ditolak' ? 'disabled' : ''}>
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                        <button class="btn-action btn-delete" title="Hapus Data" data-id="${m.id}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Attach action buttons event listeners
        attachActionListeners();
    };

    const attachActionListeners = () => {
        // Approve Button Click
        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const members = getMembers();
                const updated = members.map(m => {
                    if (m.id === id) {
                        return { ...m, status: 'Disetujui' };
                    }
                    return m;
                });
                saveMembers(updated);
                renderTable();
            });
        });

        // Reject Button Click
        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const members = getMembers();
                const updated = members.map(m => {
                    if (m.id === id) {
                        return { ...m, status: 'Ditolak' };
                    }
                    return m;
                });
                saveMembers(updated);
                renderTable();
            });
        });

        // Delete Button Click
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm(`Apakah Anda yakin ingin menghapus data pendaftar ID ${id}?`)) {
                    const members = getMembers();
                    const filtered = members.filter(m => m.id !== id);
                    saveMembers(filtered);
                    renderTable();
                }
            });
        });
    };

    // 5. Search & Filter Event Listeners
    searchInput.addEventListener('input', renderTable);
    provinceFilter.addEventListener('change', renderTable);

    // Initial table render
    renderTable();

    // 6. Logout Logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin keluar dari panel admin?')) {
                sessionStorage.removeItem('admin_logged_in');
                window.location.replace('index.html');
            }
        });
    }
});
