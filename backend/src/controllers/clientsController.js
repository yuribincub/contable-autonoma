// backend/src/controllers/clientsController.js
// Mismo patrón que incomeController / expensesController:
//   - Supabase directo via require('../config/supabase')
//   - user_id en query (GET) o body (POST/PUT/DELETE)

const supabase = require('../config/supabase');

const SELECT_FIELDS = [
  'id', 'user_id', 'name', 'tax_id', 'country', 'country_code',
  'email', 'phone', 'address', 'is_non_eu', 'vat_rate',
  'notes', 'is_active', 'created_at', 'updated_at',
].join(', ');

// GET /clients?user_id=xxx
async function getAll(req, res) {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id requerido' });

  try {
    const { data, error } = await supabase
      .from('clients')
      .select(SELECT_FIELDS)
      .eq('user_id', user_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    console.error('[clients.getAll]', err.message);
    res.status(500).json({ error: err.message });
  }
}

// GET /clients/:id?user_id=xxx
async function getOne(req, res) {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id requerido' });

  try {
    const { data, error } = await supabase
      .from('clients')
      .select(SELECT_FIELDS)
      .eq('id', req.params.id)
      .eq('user_id', user_id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ data });
  } catch (err) {
    console.error('[clients.getOne]', err.message);
    res.status(500).json({ error: err.message });
  }
}

// POST /clients
// body: { user_id, name, tax_id, country, country_code, email, phone, address, is_non_eu, notes }
async function create(req, res) {
  const { user_id, name, tax_id, country, country_code, email, phone, address, is_non_eu, notes } = req.body;

  if (!user_id)      return res.status(400).json({ error: 'user_id requerido' });
  if (!name?.trim()) return res.status(400).json({ error: 'name requerido' });
  if (!tax_id?.trim()) return res.status(400).json({ error: 'tax_id requerido' });
  if (!country?.trim()) return res.status(400).json({ error: 'country requerido' });

  try {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id,
        name:         name.trim(),
        tax_id:       tax_id.trim(),
        country:      country.trim(),
        country_code: country_code ?? null,
        email:        email?.trim()   ?? null,
        phone:        phone?.trim()   ?? null,
        address:      address?.trim() ?? null,
        is_non_eu:    is_non_eu === true,
        notes:        notes?.trim()   ?? null,
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (err) {
    console.error('[clients.create]', err.message);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un cliente con ese NIF/VAT' });
    }
    res.status(500).json({ error: err.message });
  }
}

// PUT /clients/:id
// body: { user_id, ...campos a actualizar }
async function update(req, res) {
  const { user_id, name, tax_id, country, country_code, email, phone, address, is_non_eu, notes } = req.body;

  if (!user_id) return res.status(400).json({ error: 'user_id requerido' });

  const payload = {};
  if (name         !== undefined) payload.name         = name.trim();
  if (tax_id       !== undefined) payload.tax_id       = tax_id.trim();
  if (country      !== undefined) payload.country      = country.trim();
  if (country_code !== undefined) payload.country_code = country_code;
  if (email        !== undefined) payload.email        = email?.trim() ?? null;
  if (phone        !== undefined) payload.phone        = phone?.trim() ?? null;
  if (address      !== undefined) payload.address      = address?.trim() ?? null;
  if (is_non_eu    !== undefined) payload.is_non_eu    = is_non_eu === true;
  if (notes        !== undefined) payload.notes        = notes?.trim() ?? null;

  try {
    const { data, error } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', req.params.id)
      .eq('user_id', user_id)
      .select(SELECT_FIELDS)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ data });
  } catch (err) {
    console.error('[clients.update]', err.message);
    res.status(500).json({ error: err.message });
  }
}

// DELETE /clients/:id  — soft delete (is_active = false)
// body: { user_id }
async function remove(req, res) {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id requerido' });

  try {
    const { data, error } = await supabase
      .from('clients')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .eq('user_id', user_id)
      .select('id')
      .single();

    if (error || !data) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ message: 'Cliente eliminado', id: data.id });
  } catch (err) {
    console.error('[clients.remove]', err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getOne, create, update, remove };
