// Mengambil data transaksi
let transactions = [];

try {
    transactions = JSON.parse(
        localStorage.getItem("sakuin-transactions")
    ) || [];
} catch (error) {
    transactions = [];
}

let editIndex = null;

// Mendapatkan tanggal lokal
function getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Format Rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(angka);
}

// Menyimpan transaksi
function saveTransactions() {
    localStorage.setItem(
        "sakuin-transactions",
        JSON.stringify(transactions)
    );
}

// ================================
// FITUR PENCARIAN DAN FILTER
// ================================

const transactionList = document.getElementById("transaction-list");

// Membuat kolom pencarian
const searchContainer = document.createElement("div");
searchContainer.style.display = "flex";
searchContainer.style.gap = "12px";
searchContainer.style.marginBottom = "20px";
searchContainer.style.flexWrap = "wrap";

const searchInput = document.createElement("input");
searchInput.type = "text";
searchInput.placeholder = "Cari nama transaksi...";
searchInput.style.flex = "1";
searchInput.style.minWidth = "180px";
searchInput.style.padding = "12px";
searchInput.style.border = "1px solid #DCE5DC";
searchInput.style.borderRadius = "10px";
searchInput.style.fontSize = "14px";
searchInput.style.outline = "none";

const filterSelect = document.createElement("select");
filterSelect.style.padding = "12px";
filterSelect.style.border = "1px solid #DCE5DC";
filterSelect.style.borderRadius = "10px";
filterSelect.style.backgroundColor = "white";
filterSelect.style.color = "#354D40";
filterSelect.style.fontSize = "14px";

filterSelect.innerHTML = `
    <option value="all">Semua Transaksi</option>
    <option value="income">Pemasukan</option>
    <option value="expense">Pengeluaran</option>
`;

searchContainer.append(searchInput, filterSelect);
transactionList.parentElement.insertBefore(
    searchContainer,
    transactionList
);

// Memperbarui tampilan saat mencari atau memfilter
searchInput.addEventListener("input", displayTransactions);
filterSelect.addEventListener("change", displayTransactions);

// Memperbarui dashboard
function updateDashboard() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(function(item) {
        if (item.type === "income") {
            totalIncome += Number(item.amount);
        } else {
            totalExpense += Number(item.amount);
        }
    });

    document.getElementById("balance").textContent =
        formatRupiah(totalIncome - totalExpense);

    document.getElementById("income").textContent =
        formatRupiah(totalIncome);

    document.getElementById("expense").textContent =
        formatRupiah(totalExpense);

    displayTransactions();
    updateMonthlyReport();
}

// ================================
// MENAMPILKAN RIWAYAT TRANSAKSI
// ================================

function displayTransactions() {
    const list = document.getElementById("transaction-list");
    list.innerHTML = "";

    const keyword = searchInput.value.toLowerCase().trim();
    const selectedFilter = filterSelect.value;

    // Mengambil transaksi sesuai pencarian dan filter
    let filteredTransactions = transactions.map(function(item, index) {
        return { ...item, originalIndex: index };
    });

    if (keyword !== "") {
        filteredTransactions = filteredTransactions.filter(function(item) {
            return item.name.toLowerCase().includes(keyword);
        });
    }

    if (selectedFilter !== "all") {
        filteredTransactions = filteredTransactions.filter(function(item) {
            return item.type === selectedFilter;
        });
    }

    // Jika tidak mencari atau memfilter, tampilkan 5 transaksi terakhir
    if (keyword === "" && selectedFilter === "all") {
        filteredTransactions = filteredTransactions.slice(-5);
    }

    filteredTransactions.reverse();

    if (filteredTransactions.length === 0) {
        list.innerHTML = "<p>Transaksi tidak ditemukan.</p>";
        return;
    }

    filteredTransactions.forEach(function(item) {
        const transaction = document.createElement("div");
        transaction.className = "transaction-item";

        const information = document.createElement("div");
        information.className = "transaction-info";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const type = document.createElement("p");
        type.textContent =
            item.type === "income" ? "Pemasukan" : "Pengeluaran";

        const category = document.createElement("p");
        category.textContent =
            "Kategori: " + (item.category || "Lainnya");

        const date = document.createElement("p");
        date.textContent = item.date
            ? "Tanggal: " + item.date
            : "Tanggal belum tersedia";

        information.append(name, type, category, date);

        const actions = document.createElement("div");
        actions.className = "transaction-actions";

        const amount = document.createElement("strong");
        amount.className = "transaction-amount";
        amount.textContent =
            (item.type === "income" ? "+ " : "- ") +
            formatRupiah(item.amount);

        // Tombol Edit
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function() {
            editTransaction(item.originalIndex);
        });

        // Tombol Hapus
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Hapus";

        deleteButton.addEventListener("click", function() {
            if (confirm("Yakin ingin menghapus transaksi ini?")) {
                transactions.splice(item.originalIndex, 1);

                if (editIndex === item.originalIndex) {
                    cancelEdit();
                } else if (
                    editIndex !== null &&
                    item.originalIndex < editIndex
                ) {
                    editIndex--;
                }

                saveTransactions();
                updateDashboard();

                alert("Transaksi berhasil dihapus!");
            }
        });

        actions.append(amount, editButton, deleteButton);
        transaction.append(information, actions);
        list.appendChild(transaction);
    });
}

// ================================
// FORM TRANSAKSI
// ================================

const transactionForm = document.getElementById("transaction-form");
const nameInput = document.getElementById("transaction-name");
const typeInput = document.getElementById("transaction-type");
const categoryInput = document.getElementById("transaction-category");
const amountInput = document.getElementById("transaction-amount");

const formTitle = document.querySelector(".form-section h2");
const submitButton = transactionForm.querySelector('button[type="submit"]');

// Membuat tombol Batal Edit
const cancelButton = document.createElement("button");
cancelButton.type = "button";
cancelButton.textContent = "Batal Edit";
cancelButton.className = "cancel-button";
cancelButton.style.display = "none";

submitButton.insertAdjacentElement("afterend", cancelButton);

// Fungsi Edit Transaksi
function editTransaction(index) {
    const item = transactions[index];

    if (!item) return;

    editIndex = index;

    nameInput.value = item.name;
    typeInput.value = item.type;
    categoryInput.value = item.category || "Lainnya";
    amountInput.value = item.amount;

    formTitle.textContent = "Edit Transaksi";
    submitButton.textContent = "Simpan Perubahan";
    cancelButton.style.display = "block";

    document.getElementById("form-section").scrollIntoView({
        behavior: "smooth"
    });
}

// Membatalkan Edit
function cancelEdit() {
    editIndex = null;
    transactionForm.reset();

    formTitle.textContent = "Tambah Transaksi";
    submitButton.textContent = "Simpan Transaksi";
    cancelButton.style.display = "none";
}

cancelButton.addEventListener("click", cancelEdit);

// Menyimpan transaksi baru atau hasil edit
transactionForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = nameInput.value.trim();
    const type = typeInput.value;
    const category = categoryInput.value;
    const amount = Number(amountInput.value);

    if (name === "" || !Number.isFinite(amount) || amount <= 0) {
        alert("Periksa kembali nama dan jumlah transaksi!");
        return;
    }

    const transactionData = {
        name: name,
        type: type,
        category: category,
        amount: amount
    };

    if (editIndex !== null) {
        transactionData.date =
            transactions[editIndex].date || getToday();

        transactions[editIndex] = transactionData;
        alert("Transaksi berhasil diperbarui!");
    } else {
        transactionData.date = getToday();
        transactions.push(transactionData);
        alert("Transaksi berhasil disimpan!");
    }

    saveTransactions();
    cancelEdit();
    updateDashboard();
});
// ================================
// GRAFIK BULANAN
// ================================

function updateMonthlyChart(income, expense) {
    const incomeBar = document.getElementById("chart-income-bar");
    const expenseBar = document.getElementById("chart-expense-bar");

    const incomeValue = document.getElementById("chart-income-value");
    const expenseValue = document.getElementById("chart-expense-value");

    const maxValue = Math.max(income, expense);

    let incomeHeight = 0;
    let expenseHeight = 0;

    if (maxValue > 0) {
        incomeHeight = (income / maxValue) * 160;
        expenseHeight = (expense / maxValue) * 160;
    }

    incomeBar.style.height = incomeHeight + "px";
    expenseBar.style.height = expenseHeight + "px";

    incomeValue.textContent = formatRupiah(income);
    expenseValue.textContent = formatRupiah(expense);
}

// ================================
// LAPORAN KEUANGAN BULANAN
// ================================

const reportMonth = document.getElementById("report-month");

// Mengatur bulan awal ke bulan sekarang
reportMonth.value = getToday().slice(0, 7);

function updateMonthlyReport() {
    const selectedMonth = reportMonth.value;

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    const categoryTotals = {};

    const monthlyTransactions = transactions.filter(function(item) {
        return item.date &&
            item.date.slice(0, 7) === selectedMonth;
    });

    monthlyTransactions.forEach(function(item) {
        const amount = Number(item.amount);

        if (item.type === "income") {
            monthlyIncome += amount;
        } else {
            monthlyExpense += amount;

            const category = item.category || "Lainnya";

            categoryTotals[category] =
                (categoryTotals[category] || 0) + amount;
        }
    });

    document.getElementById("monthly-income").textContent =
        formatRupiah(monthlyIncome);

    document.getElementById("monthly-expense").textContent =
        formatRupiah(monthlyExpense);

    document.getElementById("monthly-balance").textContent =
        formatRupiah(monthlyIncome - monthlyExpense);

    // Memperbarui grafik
    updateMonthlyChart(monthlyIncome, monthlyExpense);

    // Menampilkan pengeluaran berdasarkan kategori
    const categoryReport =
        document.getElementById("category-report");

    categoryReport.innerHTML = "";

    const categories = Object.entries(categoryTotals);

    if (categories.length === 0) {
        categoryReport.innerHTML =
            "<p>Belum ada data pengeluaran pada bulan ini.</p>";
        return;
    }

    categories.sort(function(a, b) {
        return b[1] - a[1];
    });

    categories.forEach(function(item) {
        const row = document.createElement("div");
        row.className = "category-row";

        const categoryName = document.createElement("span");
        categoryName.textContent = item[0];

        const categoryAmount = document.createElement("strong");
        categoryAmount.textContent = formatRupiah(item[1]);

        row.append(categoryName, categoryAmount);
        categoryReport.appendChild(row);
    });
}

// Ketika bulan diganti
reportMonth.addEventListener("change", updateMonthlyReport);

// Menampilkan data awal
updateDashboard();

// ========================================
// FITUR FILTER TRANSAKSI BERDASARKAN TANGGAL
// ========================================

// Membuat input tanggal awal
const startDateInput = document.createElement("input");
startDateInput.type = "date";
startDateInput.title = "Tanggal Awal";
startDateInput.style.padding = "12px";
startDateInput.style.border = "1px solid #DCE5DC";
startDateInput.style.borderRadius = "10px";
startDateInput.style.fontSize = "14px";

// Membuat input tanggal akhir
const endDateInput = document.createElement("input");
endDateInput.type = "date";
endDateInput.title = "Tanggal Akhir";
endDateInput.style.padding = "12px";
endDateInput.style.border = "1px solid #DCE5DC";
endDateInput.style.borderRadius = "10px";
endDateInput.style.fontSize = "14px";

// Tombol reset tanggal
const resetDateButton = document.createElement("button");
resetDateButton.type = "button";
resetDateButton.textContent = "Reset Tanggal";
resetDateButton.style.padding = "12px";
resetDateButton.style.border = "none";
resetDateButton.style.borderRadius = "10px";
resetDateButton.style.backgroundColor = "#527A60";
resetDateButton.style.color = "white";
resetDateButton.style.cursor = "pointer";

// Menambahkan input ke bagian pencarian
searchContainer.append(
    startDateInput,
    endDateInput,
    resetDateButton
);

// Memperbarui tampilan ketika tanggal berubah
startDateInput.addEventListener("change", displayTransactions);
endDateInput.addEventListener("change", displayTransactions);

// Mengembalikan filter tanggal ke kondisi awal
resetDateButton.addEventListener("click", function() {
    startDateInput.value = "";
    endDateInput.value = "";
    displayTransactions();
});

// Mengganti fungsi tampilan transaksi
displayTransactions = function() {
    const list = document.getElementById("transaction-list");
    list.innerHTML = "";

    const keyword = searchInput.value.toLowerCase().trim();
    const selectedFilter = filterSelect.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    let filteredTransactions = transactions.map(function(item, index) {
        return {
            ...item,
            originalIndex: index
        };
    });

    // Filter berdasarkan nama transaksi
    if (keyword !== "") {
        filteredTransactions = filteredTransactions.filter(function(item) {
            return item.name.toLowerCase().includes(keyword);
        });
    }

    // Filter berdasarkan jenis transaksi
    if (selectedFilter !== "all") {
        filteredTransactions = filteredTransactions.filter(function(item) {
            return item.type === selectedFilter;
        });
    }

    // Filter berdasarkan tanggal awal
    if (startDate !== "") {
        filteredTransactions = filteredTransactions.filter(function(item) {
            return item.date && item.date >= startDate;
        });
    }

    // Filter berdasarkan tanggal akhir
    if (endDate !== "") {
        filteredTransactions = filteredTransactions.filter(function(item) {
            return item.date && item.date <= endDate;
        });
    }

    // Menampilkan 5 transaksi terakhir jika semua filter kosong
    if (
        keyword === "" &&
        selectedFilter === "all" &&
        startDate === "" &&
        endDate === ""
    ) {
        filteredTransactions = filteredTransactions.slice(-5);
    }

    filteredTransactions.reverse();

    if (filteredTransactions.length === 0) {
        list.innerHTML = "<p>Transaksi tidak ditemukan.</p>";
        return;
    }

    filteredTransactions.forEach(function(item) {
        const transaction = document.createElement("div");
        transaction.className = "transaction-item";

        const information = document.createElement("div");
        information.className = "transaction-info";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const type = document.createElement("p");
        type.textContent =
            item.type === "income" ? "Pemasukan" : "Pengeluaran";

        const category = document.createElement("p");
        category.textContent =
            "Kategori: " + (item.category || "Lainnya");

        const date = document.createElement("p");
        date.textContent = item.date
            ? "Tanggal: " + item.date
            : "Tanggal belum tersedia";

        information.append(name, type, category, date);

        const actions = document.createElement("div");
        actions.className = "transaction-actions";

        const amount = document.createElement("strong");
        amount.className = "transaction-amount";
        amount.textContent =
            (item.type === "income" ? "+ " : "- ") +
            formatRupiah(item.amount);

        // Tombol Edit
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function() {
            editTransaction(item.originalIndex);
        });

        // Tombol Hapus
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Hapus";

        deleteButton.addEventListener("click", function() {
            if (confirm("Yakin ingin menghapus transaksi ini?")) {
                transactions.splice(item.originalIndex, 1);

                if (editIndex === item.originalIndex) {
                    cancelEdit();
                } else if (
                    editIndex !== null &&
                    item.originalIndex < editIndex
                ) {
                    editIndex--;
                }

                saveTransactions();
                updateDashboard();

                alert("Transaksi berhasil dihapus!");
            }
        });

        actions.append(amount, editButton, deleteButton);
        transaction.append(information, actions);
        list.appendChild(transaction);
    });
};

// Memperbarui tampilan awal
displayTransactions();

/* =================================
   FITUR CETAK LAPORAN KEUANGAN PDF
================================= */

// Mengambil bagian laporan keuangan
const reportSection = document.getElementById("report-section");

// Membuat tombol cetak PDF
const printButton = document.createElement("button");
printButton.type = "button";
printButton.textContent = "Cetak / Simpan PDF";
printButton.className = "print-button";

// Mengatur tampilan tombol
printButton.style.padding = "12px 20px";
printButton.style.marginTop = "20px";
printButton.style.backgroundColor = "#527A60";
printButton.style.color = "white";
printButton.style.border = "none";
printButton.style.borderRadius = "10px";
printButton.style.cursor = "pointer";
printButton.style.fontSize = "14px";

// Menambahkan tombol ke laporan
reportSection.appendChild(printButton);

// Membuat aturan tampilan khusus saat dicetak
const printStyle = document.createElement("style");
printStyle.textContent = `
    @media print {
        body * {
            visibility: hidden;
        }

        #report-section,
        #report-section * {
            visibility: visible;
        }

        #report-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 25px;
            background: white;
            color: black;
        }

        .print-button {
            display: none !important;
        }

        #report-month {
            border: none;
            color: black;
        }

        body {
            background: white !important;
        }
    }
`;

document.head.appendChild(printStyle);

// Menjalankan fitur cetak
printButton.addEventListener("click", function() {
    window.print();
});

/* =====================================
   FITUR ANGGARAN BULANAN (BUDGETING)
===================================== */

// Mengambil data anggaran dari localStorage
let monthlyBudgets = {};

try {
    monthlyBudgets = JSON.parse(
        localStorage.getItem("sakuin-monthly-budget")
    ) || {};
} catch (error) {
    monthlyBudgets = {};
}

// Membuat tampilan budgeting
const budgetSection = document.createElement("div");
budgetSection.className = "budget-section";
budgetSection.style.marginTop = "25px";
budgetSection.style.padding = "20px";
budgetSection.style.backgroundColor = "#FFFFFF";
budgetSection.style.borderRadius = "15px";
budgetSection.style.border = "1px solid #E1E9E1";

budgetSection.innerHTML = `
    <h2>Anggaran Bulanan</h2>
    <p style="color: #718078;">
        Atur batas pengeluaran agar keuangan tetap terkontrol.
    </p>

    <label for="budget-amount">Batas Anggaran (Rp)</label>

    <div style="
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 10px;
    ">
        <input
            type="number"
            id="budget-amount"
            min="1"
            placeholder="Masukkan anggaran"
            style="
                flex: 1;
                min-width: 180px;
                padding: 12px;
                border: 1px solid #DCE5DC;
                border-radius: 10px;
            "
        >

        <button
            type="button"
            id="save-budget"
            style="
                padding: 12px 20px;
                border: none;
                border-radius: 10px;
                background: #527A60;
                color: white;
                cursor: pointer;
            "
        >
            Simpan Anggaran
        </button>
    </div>

    <div style="margin-top: 20px;">
        <p>Anggaran Bulan Ini</p>
        <h3 id="budget-total">Rp0</h3>

        <p>Pengeluaran Terpakai</p>
        <h3 id="budget-used">Rp0</h3>

        <div style="
            width: 100%;
            height: 14px;
            background: #E8EEE8;
            border-radius: 20px;
            overflow: hidden;
            margin-top: 12px;
        ">
            <div
                id="budget-progress"
                style="
                    width: 0%;
                    height: 100%;
                    background: #6C9878;
                    border-radius: 20px;
                    transition: width 0.3s;
                "
            ></div>
        </div>

        <p id="budget-percentage" style="margin-top: 10px;">
            0% anggaran terpakai
        </p>

        <h3 id="budget-status">
            Silakan atur anggaran bulanan.
        </h3>
    </div>
`;

// Menambahkan bagian budgeting ke laporan
reportSection.appendChild(budgetSection);

// Mengambil elemen budgeting
const budgetInput = document.getElementById("budget-amount");
const saveBudgetButton = document.getElementById("save-budget");

const budgetTotal = document.getElementById("budget-total");
const budgetUsed = document.getElementById("budget-used");
const budgetProgress = document.getElementById("budget-progress");
const budgetPercentage = document.getElementById("budget-percentage");
const budgetStatus = document.getElementById("budget-status");

// Menyimpan anggaran
saveBudgetButton.addEventListener("click", function() {
    const selectedMonth = reportMonth.value;
    const amount = Number(budgetInput.value);

    if (!selectedMonth) {
        alert("Pilih bulan terlebih dahulu!");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Masukkan jumlah anggaran yang benar!");
        return;
    }

    monthlyBudgets[selectedMonth] = amount;

    localStorage.setItem(
        "sakuin-monthly-budget",
        JSON.stringify(monthlyBudgets)
    );

    updateBudgetDisplay();

    alert("Anggaran bulanan berhasil disimpan!");
});

// Memperbarui tampilan anggaran
function updateBudgetDisplay() {
    const selectedMonth = reportMonth.value;
    const budget = Number(monthlyBudgets[selectedMonth]) || 0;

    // Menghitung total pengeluaran pada bulan terpilih
    let totalUsed = 0;

    transactions.forEach(function(item) {
        if (
            item.type === "expense" &&
            item.date &&
            item.date.slice(0, 7) === selectedMonth
        ) {
            totalUsed += Number(item.amount);
        }
    });

    budgetInput.value = budget > 0 ? budget : "";

    budgetTotal.textContent = formatRupiah(budget);
    budgetUsed.textContent = formatRupiah(totalUsed);

    if (budget <= 0) {
        budgetProgress.style.width = "0%";
        budgetPercentage.textContent = "0% anggaran terpakai";
        budgetStatus.textContent = "Silakan atur anggaran bulanan.";
        budgetStatus.style.color = "#527A60";
        return;
    }

    const percentage = (totalUsed / budget) * 100;
    const progressWidth = Math.min(percentage, 100);

    budgetProgress.style.width = progressWidth + "%";

    budgetPercentage.textContent =
        percentage.toFixed(1) + "% anggaran terpakai";

    if (percentage >= 100) {
        budgetProgress.style.backgroundColor = "#D9534F";
        budgetStatus.textContent =
            "Peringatan! Pengeluaran sudah melewati anggaran.";
        budgetStatus.style.color = "#D9534F";
    } else if (percentage >= 80) {
        budgetProgress.style.backgroundColor = "#D99A38";
        budgetStatus.textContent =
            "Hati-hati! Anggaran hampir mencapai batas.";
        budgetStatus.style.color = "#D99A38";
    } else {
        budgetProgress.style.backgroundColor = "#6C9878";
        budgetStatus.textContent =
            "Bagus! Pengeluaran masih dalam batas anggaran.";
        budgetStatus.style.color = "#527A60";
    }
}

// Memperbarui budgeting saat bulan diganti
reportMonth.addEventListener("change", updateBudgetDisplay);

// Memperbarui budgeting saat transaksi berubah
const originalUpdateDashboard = updateDashboard;

updateDashboard = function() {
    originalUpdateDashboard();
    updateBudgetDisplay();
};

// Menampilkan data anggaran awal
updateBudgetDisplay();

// ================================
// FITUR TARGET TABUNGAN SAKUIN
// ================================

(() => {
    const savingsStorageKey = "sakuin-savings-goals";

    let savingsGoals = JSON.parse(
        localStorage.getItem(savingsStorageKey)
    ) || [];

    const savingsSection = document.createElement("section");
    savingsSection.id = "savings-section";
    savingsSection.className = "form-section";

    savingsSection.innerHTML = `
        <h2>Target Tabungan</h2>
        <p>Buat target dan pantau perkembangan tabunganmu.</p>

        <form id="savings-form">
            <input
                type="text"
                id="savings-name"
                placeholder="Nama target tabungan"
                required
            >

            <input
                type="number"
                id="savings-target"
                placeholder="Jumlah target (Rp)"
                min="1"
                required
            >

            <button type="submit">+ Buat Target</button>
        </form>

        <div id="savings-list"></div>
    `;

    const reportSection = document.getElementById("report-section");

    if (reportSection) {
        reportSection.insertAdjacentElement("afterend", savingsSection);
    } else {
        document.querySelector("main").appendChild(savingsSection);
    }

    const savingsForm = document.getElementById("savings-form");
    const savingsList = document.getElementById("savings-list");

    function saveSavingsGoals() {
        localStorage.setItem(
            savingsStorageKey,
            JSON.stringify(savingsGoals)
        );
    }

    function formatSavingsRupiah(amount) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(amount);
    }

    function renderSavingsGoals() {
        if (savingsGoals.length === 0) {
            savingsList.innerHTML = `
                <p>Belum ada target tabungan. Yuk, buat target pertamamu!</p>
            `;
            return;
        }

        savingsList.innerHTML = savingsGoals.map(goal => {
            const percentage = Math.min(
                (goal.saved / goal.target) * 100,
                100
            );
                        return `
                <div class="savings-card"
                    style="
                        background: #f4f8f2;
                        padding: 18px;
                        margin-top: 15px;
                        border-radius: 12px;
                    ">

                    <h3>${escapeSavingsHTML(goal.name)}</h3>

                    <p>
                        Terkumpul:
                        <strong>${formatSavingsRupiah(goal.saved)}</strong>
                    </p>

                    <p>
                        Target:
                        ${formatSavingsRupiah(goal.target)}
                    </p>

                    <div style="
                        background: #dce8d8;
                        height: 12px;
                        border-radius: 10px;
                        overflow: hidden;
                    ">
                        <div style="
                            width: ${percentage}%;
                            height: 100%;
                            background: #789b76;
                            border-radius: 10px;
                        "></div>
                    </div>

                    <p>
                        ${percentage.toFixed(1)}% tercapai
                    </p>

                    <button
                        type="button"
                        data-savings-action="add"
                        data-goal-id="${goal.id}">
                        + Tambah Tabungan
                    </button>

                    <button
                        type="button"
                        data-savings-action="delete"
                        data-goal-id="${goal.id}">
                        Hapus Target
                    </button>

                    ${
                        goal.saved >= goal.target
                        ? "<p>🎉 Selamat! Target tabungan tercapai!</p>"
                        : ""
                    }
                </div>
            `;
        }).join("");
    }

    function escapeSavingsHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    savingsForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const name = document.getElementById("savings-name").value.trim();
        const target = Number(
            document.getElementById("savings-target").value
        );

        if (!name || !Number.isFinite(target) || target <= 0) {
            alert("Masukkan nama dan jumlah target yang valid!");
            return;
        }

        savingsGoals.push({
            id: Date.now().toString(),
            name: name,
            target: target,
            saved: 0
        });

        saveSavingsGoals();
        renderSavingsGoals();
        savingsForm.reset();

        alert("Target tabungan berhasil dibuat!");
    });

    window.deleteSavingsGoal = function(id) {
        const confirmation = confirm(
            "Yakin ingin menghapus target tabungan ini?"
        );

        if (!confirmation) return;

        savingsGoals = savingsGoals.filter(
            goal => goal.id !== id
        );

        saveSavingsGoals();
        renderSavingsGoals();
    };

    // Menangani klik tombol target tabungan
    savingsList.addEventListener("click", function(event) {
        const button = event.target.closest("button[data-savings-action]");
        if (!button) return;

        const goalId = button.dataset.goalId;
        const action = button.dataset.savingsAction;
        const card = button.closest(".savings-card");

        // Menampilkan kolom untuk menambahkan tabungan
        if (action === "add") {
            let form = card.querySelector(".savings-add-form");

            if (form) {
                form.remove();
                return;
            }

            form = document.createElement("div");
            form.className = "savings-add-form";
            form.style.marginTop = "15px";

            form.innerHTML = `
                <input
                    type="number"
                    class="savings-add-input"
                    placeholder="Masukkan jumlah tabungan (Rp)"
                    min="1"
                    style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #DCE5DC;
                        border-radius: 9px;
                        margin-bottom: 10px;
                        box-sizing: border-box;
                    "
                >
                <button
                    type="button"
                    data-savings-action="save"
                    data-goal-id="${goalId}">
                    Simpan Tabungan
                </button>
                <button
                    type="button"
                    data-savings-action="cancel"
                    data-goal-id="${goalId}">
                    Batal
                </button>
                <p class="savings-error" style="color: #D9534F; margin-top: 8px;"></p>
            `;

            button.insertAdjacentElement("afterend", form);
            form.querySelector(".savings-add-input").focus();
            return;
        }

        // Menutup kolom input
        if (action === "cancel") {
            card.querySelector(".savings-add-form")?.remove();
            return;
        }

        // Menyimpan jumlah tabungan
        if (action === "save") {
            const form = card.querySelector(".savings-add-form");
            const input = form.querySelector(".savings-add-input");
            const error = form.querySelector(".savings-error");
            const amount = Number(input.value);

            if (!Number.isFinite(amount) || amount <= 0) {
                error.textContent = "Masukkan jumlah tabungan yang valid!";
                input.focus();
                return;
            }

            const goal = savingsGoals.find(item => item.id === goalId);
            if (!goal) return;

            goal.saved = Number(goal.saved) + amount;
            saveSavingsGoals();
            renderSavingsGoals();
            return;
        }

        // Menghapus target tabungan
        if (action === "delete") {
            window.deleteSavingsGoal(goalId);
        }
    });

    renderSavingsGoals();
})();

/* =================================
   FITUR EKSPOR TRANSAKSI KE CSV
================================= */

(() => {
    const transactionSection =
        document.getElementById("transaction-list");

    if (!transactionSection) return;

    // Membuat tombol ekspor
    const exportButton = document.createElement("button");

    exportButton.id = "export-csv-button";
    exportButton.type = "button";
    exportButton.textContent = "⬇ Ekspor ke Excel";

    transactionSection.parentElement.insertBefore(
        exportButton,
        transactionSection
    );

    function escapeCSV(value) {
        const text = String(value ?? "");
        return '"' + text.replace(/"/g, '""') + '"';
    }

    exportButton.addEventListener("click", function() {
        const savedTransactions = JSON.parse(
            localStorage.getItem("sakuin-transactions")
        ) || [];

        if (savedTransactions.length === 0) {
            alert("Belum ada transaksi untuk diekspor!");
            return;
        }

        const headers = [
            "Nama Transaksi",
            "Jenis Transaksi",
            "Kategori",
            "Jumlah",
            "Tanggal"
        ];

        const rows = savedTransactions.map(transaction => [
            transaction.name,
            transaction.type,
            transaction.category,
            transaction.amount,
            transaction.date
        ]);

        const csvContent = [
            headers.map(escapeCSV).join(","),
            ...rows.map(row => row.map(escapeCSV).join(","))
        ].join("\r\n");

        // BOM agar karakter terbaca dengan baik di Excel
        const blob = new Blob(
            ["\uFEFF" + csvContent],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "Laporan_Transaksi_SAKUIN.csv";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        alert("Data transaksi berhasil diekspor!");
    });
})();