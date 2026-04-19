const customerSelect = document.getElementById('customer-select');
const customerStatus = document.getElementById('customer-status');
const rentalDateInput = document.getElementById('rental-date');
const returnDateInput = document.getElementById('return-date');
const itemsContainer = document.getElementById('items-container');
const addItemBtn = document.getElementById('add-item-btn');
const submitBtn = document.getElementById('submit-btn');
const rentalForm = document.getElementById('rental-form');
const totalOutput = document.getElementById('total-output');
const daysOutput = document.getElementById('days-output');
const rentalsList = document.getElementById('rentals-list');
const messageBox = document.getElementById('message');

let customers = [];
let availableEquipment = [];
let rentals = [];

async function api(url, options = {}) {
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    };

    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

function showMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.style.color = isError ? 'crimson' : 'green';
}

function clearMessage() {
    messageBox.textContent = '';
}

function parseDate(value) {
    if (!value) return null;

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getRentalDays() {
    const start = parseDate(rentalDateInput.value);
    const end = parseDate(returnDateInput.value);

    if (!start || !end) return 0;

    const msPerDay = 1000 * 60 * 60 * 24;
    const diff = Math.round((end - start) / msPerDay);

    return diff > 0 ? diff : 0;
}

function getSelectedCustomer() {
    const id = Number.parseInt(customerSelect.value, 10);
    if (!Number.isInteger(id)) return null;

    return customers.find(customer => Number(customer.customer_id) === id) || null;
}

function getEquipmentById(equipmentId) {
    return availableEquipment.find(item => Number(item.equipment_id) === Number(equipmentId)) || null;
}

function getSelectedEquipmentIds() {
    return [...document.querySelectorAll('.rental-item-select')]
        .map(select => Number.parseInt(select.value, 10))
        .filter(id => Number.isInteger(id));
}

function renderCustomerOptions() {
    customerSelect.innerHTML = '<option value="">Select a customer</option>';

    for (const customer of customers) {
        const option = document.createElement('option');
        option.value = customer.customer_id;
        option.textContent = `${customer.customer_id} — ${customer.first_name} ${customer.last_name}`;
        customerSelect.appendChild(option);
    }
}

function buildEquipmentOptions(selectedId = '') {
    const firstOption = '<option value="">Select equipment</option>';

    const options = availableEquipment
        .map(item => {
            const selected = Number(item.equipment_id) === Number(selectedId) ? 'selected' : '';
            return `
        <option value="${item.equipment_id}" ${selected}>
          ${item.equipment_id} — ${item.name} ($${Number(item.daily_rate).toFixed(2)}/day)
        </option>
      `;
        })
        .join('');

    return firstOption + options;
}

function addItemRow(selectedId = '') {
    const row = document.createElement('div');
    row.className = 'rental-item-row';

    row.innerHTML = `
    <select class="rental-item-select" required>
      ${buildEquipmentOptions(selectedId)}
    </select>
    <button type="button" class="remove-item-btn">Remove</button>
  `;

    const select = row.querySelector('.rental-item-select');
    const removeBtn = row.querySelector('.remove-item-btn');

    select.addEventListener('change', updateSummary);

    removeBtn.addEventListener('click', () => {
        row.remove();

        if (!itemsContainer.children.length) {
            addItemRow();
        }

        updateSummary();
    });

    itemsContainer.appendChild(row);
    updateSummary();
}

function getCurrentSubtotal() {
    const days = getRentalDays();
    if (days <= 0) return 0;

    const equipmentIds = getSelectedEquipmentIds();

    let subtotal = 0;

    for (const equipmentId of equipmentIds) {
        const equipment = getEquipmentById(equipmentId);
        if (equipment) {
            subtotal += Number(equipment.daily_rate) * days;
        }
    }

    return subtotal;
}

function updateCustomerStatus() {
    const customer = getSelectedCustomer();

    if (!customer) {
        customerStatus.textContent = '';
        addItemBtn.disabled = false;
        submitBtn.disabled = false;
        return;
    }

    const isBanned = Number(customer.is_banned) === 1;
    const hasDiscount = Number(customer.has_discount) === 1;

    if (isBanned) {
        customerStatus.textContent = 'This customer is banned and cannot rent equipment.';
        customerStatus.style.color = 'crimson';
        addItemBtn.disabled = true;
        submitBtn.disabled = true;
    } else if (hasDiscount) {
        customerStatus.textContent = 'This customer has a 10% discount.';
        customerStatus.style.color = 'green';
        addItemBtn.disabled = false;
        submitBtn.disabled = false;
    } else {
        customerStatus.textContent = 'This customer has no discount.';
        customerStatus.style.color = '';
        addItemBtn.disabled = false;
        submitBtn.disabled = false;
    }
}

function updateSummary() {
    updateCustomerStatus();

    const days = getRentalDays();
    const customer = getSelectedCustomer();

    daysOutput.textContent = `Rental days: ${days}`;

    let total = getCurrentSubtotal();

    if (customer && Number(customer.has_discount) === 1) {
        total *= 0.9;
    }

    totalOutput.textContent = `Total: $${total.toFixed(2)}`;
}

function renderRentalsList() {
    if (!rentals.length) {
        rentalsList.innerHTML = '<p>No rentals found.</p>';
        return;
    }

    const rows = rentals
        .map(rental => `
      <tr>
        <td>${rental.rental_id}</td>
        <td>${rental.first_name} ${rental.last_name}</td>
        <td>${rental.rental_date}</td>
        <td>${rental.return_date}</td>
        <td>${rental.item_count}</td>
        <td>$${Number(rental.total_cost).toFixed(2)}</td>
      </tr>
    `)
        .join('');

    rentalsList.innerHTML = `
    <table border="1" cellpadding="8" cellspacing="0">
      <thead>
        <tr>
          <th>Rental ID</th>
          <th>Customer</th>
          <th>Rental Date</th>
          <th>Return Date</th>
          <th>Items</th>
          <th>Total Cost</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

async function loadData() {
    const [customerData, equipmentData, rentalData] = await Promise.all([
        api('/api/customers'),
        api('/api/equipment?status=AVAILABLE'),
        api('/api/rentals')
    ]);

    customers = customerData;
    availableEquipment = equipmentData;
    rentals = rentalData;

    renderCustomerOptions();
    renderRentalsList();
}

function resetForm() {
    rentalForm.reset();
    itemsContainer.innerHTML = '';
    addItemRow();
    customerStatus.textContent = '';
    daysOutput.textContent = 'Rental days: 0';
    totalOutput.textContent = 'Total: $0.00';
    addItemBtn.disabled = false;
    submitBtn.disabled = false;
}

async function handleSubmit(event) {
    event.preventDefault();
    clearMessage();

    const customer = getSelectedCustomer();
    if (!customer) {
        showMessage('Please select a customer.', true);
        return;
    }

    if (Number(customer.is_banned) === 1) {
        showMessage('This customer is banned and cannot rent equipment.', true);
        return;
    }

    const days = getRentalDays();
    if (days <= 0) {
        showMessage('Return date must be after rental date.', true);
        return;
    }

    const equipmentIds = getSelectedEquipmentIds();

    if (!equipmentIds.length) {
        showMessage('Please add at least one equipment item.', true);
        return;
    }

    const uniqueIds = new Set(equipmentIds);
    if (uniqueIds.size !== equipmentIds.length) {
        showMessage('You cannot add the same equipment twice.', true);
        return;
    }

    const payload = {
        customer_id: Number(customer.customer_id),
        rental_date: rentalDateInput.value,
        return_date: returnDateInput.value,
        items: equipmentIds.map(equipment_id => ({ equipment_id }))
    };

    try {
        await api('/api/rentals', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        showMessage('Rental created successfully.');
        await loadData();
        resetForm();
    } catch (err) {
        showMessage(err.message, true);
    }
}

async function init() {
    try {
        await loadData();
        resetForm();
    } catch (err) {
        showMessage(err.message, true);
    }
}

customerSelect.addEventListener('change', updateSummary);
rentalDateInput.addEventListener('change', updateSummary);
returnDateInput.addEventListener('change', updateSummary);

addItemBtn.addEventListener('click', () => {
    addItemRow();
});

rentalForm.addEventListener('submit', handleSubmit);

init();