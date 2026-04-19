import { api } from '/js/api.js';

const tbody       = document.getElementById('customers-tbody');
const errorBanner = document.getElementById('error-banner');
const dialog      = document.getElementById('customer-dialog');
const dialogTitle = document.getElementById('dialog-title');
const form        = document.getElementById('customer-form');
const btnAdd      = document.getElementById('btn-add');
const btnCancel   = document.getElementById('btn-cancel');
const searchInput = document.getElementById('search');

const fId       = document.getElementById('f-id');
const fFirst    = document.getElementById('f-first');
const fLast     = document.getElementById('f-last');
const fPhone    = document.getElementById('f-phone');
const fEmail    = document.getElementById('f-email');
const fBanned   = document.getElementById('f-banned');
const fDiscount = document.getElementById('f-discount');

let allCustomers = [];

function showError(msg) {
  errorBanner.textContent = msg;
  errorBanner.hidden = false;
}
function clearError() {
  errorBanner.hidden = true;
  errorBanner.textContent = '';
}

async function loadCustomers() {
  try {
    allCustomers = await api.get('/api/customers');
    renderTable(allCustomers);
    clearError();
  } catch (err) {
    showError(err.message);
  }
}

function renderTable(customers) {
  if (customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No customers found.</td></tr>`;
    return;
  }
  tbody.innerHTML = customers.map(c => {
    const flags = [
      c.is_banned    ? `<span class="status-pill SOLD">Banned</span>`       : '',
      c.has_discount ? `<span class="status-pill AVAILABLE">10% Off</span>` : '',
    ].join(' ');

    return `
      <tr data-id="${c.customer_id}">
        <td>${c.customer_id}</td>
        <td>${esc(c.last_name)}, ${esc(c.first_name)}</td>
        <td>${esc(c.contact_phone || '—')}</td>
        <td>${esc(c.email || '—')}</td>
        <td>${flags || '<span class="status-pill">—</span>'}</td>
        <td>
          <button onclick="editCustomer(${c.customer_id})">Edit</button>
          <button class="warn" onclick="toggleBan(${c.customer_id})">
            ${c.is_banned ? 'Unban' : 'Ban'}
          </button>
          <button onclick="toggleDiscount(${c.customer_id})">
            ${c.has_discount ? 'Remove %' : 'Add 10%'}
          </button>
        </td>
      </tr>`;
  }).join('');
}

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  renderTable(allCustomers.filter(c =>
    c.last_name.toLowerCase().includes(q)  ||
    c.first_name.toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q)
  ));
});

btnAdd.addEventListener('click', () => {
  clearError();
  form.reset();
  fId.value = '';
  dialogTitle.textContent = 'Add New Customer';
  dialog.showModal();
});

btnCancel.addEventListener('click', () => dialog.close());

window.editCustomer = function(id) {
  const c = allCustomers.find(x => x.customer_id === id);
  if (!c) return;
  clearError();
  fId.value         = c.customer_id;
  fFirst.value      = c.first_name;
  fLast.value       = c.last_name;
  fPhone.value      = c.contact_phone || '';
  fEmail.value      = c.email || '';
  fBanned.checked   = c.is_banned;
  fDiscount.checked = c.has_discount;
  dialogTitle.textContent = `Edit — ${c.first_name} ${c.last_name}`;
  dialog.showModal();
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const payload = {
    first_name:    fFirst.value.trim(),
    last_name:     fLast.value.trim(),
    contact_phone: fPhone.value.trim(),
    email:         fEmail.value.trim(),
    is_banned:     fBanned.checked,
    has_discount:  fDiscount.checked,
  };
  try {
    if (fId.value) {
      await api.patch(`/api/customers/${fId.value}`, payload);
    } else {
      await api.post('/api/customers', payload);
    }
    dialog.close();
    await loadCustomers();
  } catch (err) {
    showError(err.message);
  }
});

window.toggleBan = async function(id) {
  try {
    await api.patch(`/api/customers/${id}/ban`, {});
    await loadCustomers();
  } catch (err) { showError(err.message); }
};

window.toggleDiscount = async function(id) {
  try {
    await api.patch(`/api/customers/${id}/discount`, {});
    await loadCustomers();
  } catch (err) { showError(err.message); }
};

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadCustomers();