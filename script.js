const appScriptUrl = 'https://script.google.com/macros/s/AKfycbzItonj3AYQkDx4nXwJ8n13po8G1AXMJ568RyphAhp98POZ_lQV1lxK7ycnuguvE0Ps/exec';

const assetTable = document.getElementById('assetTable').getElementsByTagName('tbody')[0];
const searchInput = document.getElementById('search');
const addAssetButton = document.getElementById('addAssetButton');
const addEditModal = document.getElementById('addEditModal');
const modalForm = document.getElementById('assetForm');
const modalEmployeeId = document.getElementById('modal_employee_id');
const modalEmployeeName = document.getElementById('modal_employee_name');
const modalDeviceName = document.getElementById('modal_device_name');
const modalDeviceType = document.getElementById('modal_device_type');
const modalSerialNumber = document.getElementById('modal_serial_number');
const modalDepartment = document.getElementById('modal_department');
const saveButton = document.getElementById('saveButton');
const closeButtons = document.querySelectorAll('.close-button');

let allAssets = [];
let editingId = null;
let isSubmitting = false; // ตัวแปรสถานะเพื่อตรวจสอบว่ากำลังส่งข้อมูลหรือไม่

const POLLING_INTERVAL = 5000; // ตั้งค่า Interval เป็น 5 วินาที (5000 มิลลิวินาที)

addAssetButton.addEventListener('click', () => {
    editingId = null;
    modalEmployeeId.value = ''; // เคลียร์ค่า Employee ID เมื่อเปิด Modal เพิ่ม
    modalEmployeeName.value = '';
    modalDeviceName.value = '';
    modalDeviceType.value = '';
    modalSerialNumber.value = '';
    modalDepartment.value = '';
    saveButton.textContent = 'เพิ่ม';
    addEditModal.style.display = 'block';
});

// ฟังก์ชันสำหรับดึงข้อมูล Asset จาก Google Apps Script
function fetchAssets() {
    fetch(appScriptUrl)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error fetching data:', data.error);
                return;
            }
            allAssets = data.data;
            renderTable(allAssets);
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
}

// ฟังก์ชันสำหรับแสดงข้อมูลในตาราง
function renderTable(assets) {
    assetTable.innerHTML = ''; // เคลียร์ข้อมูลเก่าในตาราง
    assets.forEach(asset => {
        const row = assetTable.insertRow();
        row.insertCell().textContent = asset.employee_id;
        row.insertCell().textContent = asset.employee_name;
        row.insertCell().textContent = asset.device_name;
        row.insertCell().textContent = asset.device_type;
        row.insertCell().textContent = asset.serial_number;
        row.insertCell().textContent = asset.department;

        const actionsCell = row.insertCell();
        const editButton = document.createElement('button');
        editButton.textContent = 'แก้ไข';
        editButton.addEventListener('click', () => openEditModal(asset));

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'ลบ';
        deleteButton.addEventListener('click', () => deleteAsset(asset.employee_id));

        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);
    });
}

// ฟังก์ชันสำหรับค้นหาข้อมูล
searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredAssets = allAssets.filter(asset => {
        return Object.values(asset).some(value => String(value).toLowerCase().includes(searchTerm));
    });
    renderTable(filteredAssets);
});

// ฟังก์ชันเปิด Modal สำหรับแก้ไข Asset
function openEditModal(asset) {
    editingId = asset.employee_id;
    modalEmployeeId.value = asset.employee_id;
    modalEmployeeName.value = asset.employee_name;
    modalDeviceName.value = asset.device_name;
    modalDeviceType.value = asset.device_type;
    modalSerialNumber.value = asset.serial_number;
    modalDepartment.value = asset.department;
    saveButton.textContent = 'บันทึก';
    addEditModal.style.display = 'block';
}

// ฟังก์ชันปิด Modal
closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        addEditModal.style.display = 'none';
    });
});

window.addEventListener('click', (event) => {
    if (event.target === addEditModal) {
        addEditModal.style.display = 'none';
    }
});

// ฟังก์ชันสำหรับส่งข้อมูลเพื่อเพิ่มหรือแก้ไข Asset
modalForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (isSubmitting) {
        return; // ป้องกันการทำงานซ้ำหากกำลังส่งข้อมูลอยู่
    }

    isSubmitting = true;
    saveButton.disabled = true; // ปิดการใช้งานปุ่มบันทึก

    const formData = {
        employee_id: modalEmployeeId.value, // รวม Employee ID ใน Form Data
        employee_name: modalEmployeeName.value,
        device_name: modalDeviceName.value,
        device_type: modalDeviceType.value,
        serial_number: modalSerialNumber.value,
        department: modalDepartment.value,
        action: editingId ? 'edit' : 'add'
    };

    let url = appScriptUrl;
    let method = 'POST';

    if (editingId) {
        formData.employee_id = editingId; // Ensure ID is sent for editing
    }

    fetch(url, {
        method: method,
        mode: 'no-cors', // Required for Google Apps Script
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(formData).toString()
    })
    .then(response => {
        console.log('Response from Apps Script (Add/Edit):', response);
        if (!response.ok) {
            console.error('HTTP error, status = ' + response.status);
            return Promise.reject('HTTP error');
        }
        return response.text(); // เปลี่ยนเป็น .text() เพื่อดูเนื้อหา Response ก่อนแปลง JSON
    })
    .then(responseText => {
        console.log('Response Text (Add/Edit):', responseText);
        try {
            const data = JSON.parse(responseText);
            console.log('Data from Apps Script (Add/Edit):', data);
            if (data.error) {
                console.error('Error:', data.error);
            } else {
                fetchAssets(); // เรียก fetchAssets() หลังจากบันทึกสำเร็จ เพื่ออัปเดตตาราง
                addEditModal.style.display = 'none'; // ปิด Modal หลังจากบันทึกสำเร็จ (ทั้งเพิ่มและแก้ไข)
                editingId = null;
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.error('Response that caused the error:', responseText);
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
    })
    .finally(() => {
        isSubmitting = false;
        saveButton.disabled = false; // เปิดการใช้งานปุ่มบันทึกเมื่อการทำงานเสร็จสิ้น (สำเร็จหรือล้มเหลว)
    });
});

// ฟังก์ชันสำหรับลบ Asset
function deleteAsset(id) {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ Asset ID: ${id}?`)) {
        fetch(appScriptUrl, {
            method: 'POST',
            mode: 'no-cors', // Required for Google Apps Script
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ action: 'delete', employee_id: id }).toString()
        })
        .then(response => {
            if (!response.ok) {
                console.error('HTTP error, status = ' + response.status);
                return Promise.reject('HTTP error');
            }
            return response.json();
        })
        .then(data => {
            console.log('Data from Apps Script (Delete):', data);
            if (data.error) {
                console.error('Error:', data.error);
            } else {
                fetchAssets(); // เรียก fetchAssets() หลังจากลบสำเร็จ เพื่ออัปเดตตาราง
                // เราจะไม่ปิด Modal ในกรณีลบ เพราะไม่มี Modal สำหรับการลบ
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
    }
}

// โหลดข้อมูล Asset เมื่อหน้าเว็บโหลดเสร็จ
fetchAssets();

// ตั้ง Interval สำหรับการดึงข้อมูลใหม่เป็นระยะ
setInterval(fetchAssets, 5000); // ดึงข้อมูลทุกๆ 5 วินาที