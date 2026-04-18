import { api } from '/js/api.js';

const tbody         = document.getElementById('equipment-tbody');
const emptyState    = document.getElementById('empty-state');
const errorBanner   = document.getElementById('error-banner');
const statusFilter  = document.getElementById('status-filter');
const addBtn        = document.getElementById('add-btn');
const addDialog     = document.getElementById('add-dialog');
const addForm       = document.getElementById('add-form');
const categorySelect = document.getElementById('category-select');
const cancelBtn     = document.getElementById('cancel-btn');
const formError     = document.getElementById('form-error');

const DELETE_DISABLED_STATUSES = new Set(['SOLD', 'DAMAGED']);

function showError(el, message) {
  el.textContent = message;
  el.hidden = false;
}
function clearError(el) {
  el.textContent = '';
  el.hidden = true;
}

function formatMoney(n) {
  return `$${Number(n).toFixed(2)}`;
}

function rowTemplate(item) {
  const disabled = DELETE_DISABLED_STATUSES.has(item.status) ? 'disabled' : '';
  return `
    <tr data-id="${item.equipment_id}">
      <td>${item.equipment_id}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.category_name)}</td>
      <td>${escapeHtml(item.description ?? '')}</td>
      <td>${formatMoney(item.daily_rate)}</td>
      <td><span class="status-pill ${item.status}">${item.status}</span></td>
      <td>
        <button class="warn"   data-action="mark-sold"    ${disabled}>Mark Sold</button>
        <button class="danger" data-action="mark-damaged" ${disabled}>Mark Damaged</button>
      </td>
    </tr>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadEquipment() {
  clearError(errorBanner);
  try {
    const params = new URLSearchParams();
    if (statusFilter.value) params.set('status', statusFilter.value);
    const query = params.toString() ? `?${params}` : '';
    const rows = await api.get(`/api/equipment${query}`);
    tbody.innerHTML = rows.map(rowTemplate).join('');
    emptyState.hidden = rows.length > 0;
  } catch (err) {
    showError(errorBanner, `Failed to load equipment: ${err.message}`);
  }
}

async function loadCategories() {
  try {
    const rows = await api.get('/api/categories');
    categorySelect.innerHTML = rows
      .map(c => `<option value="${c.category_id}">${escapeHtml(c.name)}</option>`)
      .join('');
  } catch (err) {
    showError(errorBanner, `Failed to load categories: ${err.message}`);
  }
}

statusFilter.addEventListener('change', loadEquipment);

addBtn.addEventListener('click', () => {
  clearError(formError);
  addForm.reset();
  addDialog.showModal();
});

cancelBtn.addEventListener('click', () => {
  addDialog.close();
});

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError(formError);

  const formData = new FormData(addForm);
  const payload = {
    category_id: Number.parseInt(formData.get('category_id'), 10),
    name: String(formData.get('name') || '').trim(),
    description: String(formData.get('description') || '').trim() || null,
    daily_rate: Number.parseFloat(formData.get('daily_rate')),
  };

  try {
    await api.post('/api/equipment', payload);
    addDialog.close();
    await loadEquipment();
  } catch (err) {
    showError(formError, err.message);
  }
});

tbody.addEventListener('click', async (event) => {
  const btn = event.target.closest('button[data-action]');
  if (!btn) return;
  const row = btn.closest('tr');
  const id = row?.dataset.id;
  if (!id) return;

  const status = btn.dataset.action === 'mark-sold' ? 'SOLD' : 'DAMAGED';
  const label = status === 'SOLD' ? 'sold' : 'damaged';
  if (!confirm(`Mark equipment ${id} as ${label}?`)) return;

  try {
    await api.patch(`/api/equipment/${id}/status`, { status });
    await loadEquipment();
  } catch (err) {
    showError(errorBanner, err.message);
  }
});

await loadCategories();
await loadEquipment();
