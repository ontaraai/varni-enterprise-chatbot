import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Package } from 'lucide-react';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../api/admin';

const EMPTY_PRODUCT = {
  name: '',
  category: '',
  description: '',
  specifications: {},
  price: '',
  moq: '',
  inStock: true,
  applications: [],
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_PRODUCT });
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [appInput, setAppInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const openCreate = () => {
    setForm({ ...EMPTY_PRODUCT });
    setEditing(null);
    setModal('create');
  };

  const openEdit = (product) => {
    setForm({
      name: product.name,
      category: product.category,
      description: product.description,
      specifications: product.specifications instanceof Object ? { ...product.specifications } : {},
      price: product.price,
      moq: product.moq || '',
      inStock: product.inStock,
      applications: product.applications || [],
    });
    setEditing(product);
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setEditing(null);
    setSpecKey('');
    setSpecVal('');
    setAppInput('');
  };

  const addSpec = () => {
    if (!specKey.trim()) return;
    setForm((prev) => ({
      ...prev,
      specifications: { ...prev.specifications, [specKey.trim()]: specVal.trim() },
    }));
    setSpecKey('');
    setSpecVal('');
  };

  const removeSpec = (key) => {
    setForm((prev) => {
      const specs = { ...prev.specifications };
      delete specs[key];
      return { ...prev, specifications: specs };
    });
  };

  const addApplication = () => {
    if (!appInput.trim()) return;
    const newApps = appInput.split(',').map((a) => a.trim()).filter(Boolean);
    setForm((prev) => ({
      ...prev,
      applications: [...new Set([...prev.applications, ...newApps])],
    }));
    setAppInput('');
  };

  const removeApplication = (app) => {
    setForm((prev) => ({
      ...prev,
      applications: prev.applications.filter((a) => a !== app),
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.description || !form.price) {
      alert('Please fill in name, category, description, and price.');
      return;
    }
    setSaving(true);
    try {
      if (modal === 'create') {
        await createProduct(form);
      } else {
        await updateProduct(editing._id, form);
      }
      closeModal();
      loadProducts();
    } catch (err) {
      console.error('Failed to save product:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setConfirmDelete(null);
      loadProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-header__title">Products</h1>
          <p className="page-header__subtitle">Manage your product catalog</p>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading__spinner" />
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon"><Package /></div>
          <div className="empty-state__text">No products yet</div>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((p) => (
            <div key={p._id} className="product-card">
              <div className="product-card__header">
                <div>
                  <div className="product-card__name">{p.name}</div>
                  <div className="product-card__category">{p.category}</div>
                </div>
                <span className={`badge ${p.inStock ? 'badge--in-stock' : 'badge--out-of-stock'}`}>
                  <span className="badge__dot" />
                  {p.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              <div className="product-card__price">{p.price}</div>
              <div className="product-card__desc">{p.description}</div>

              {p.specifications && Object.keys(p.specifications).length > 0 && (
                <div className="product-card__specs">
                  {Object.entries(p.specifications).slice(0, 4).map(([k, v]) => (
                    <span key={k} className="product-card__spec">
                      {k}: {v}
                    </span>
                  ))}
                  {Object.keys(p.specifications).length > 4 && (
                    <span className="product-card__spec">
                      +{Object.keys(p.specifications).length - 4} more
                    </span>
                  )}
                </div>
              )}

              <div className="product-card__actions">
                <button className="btn btn--secondary btn--sm" onClick={() => openEdit(p)}>
                  <Pencil size={12} />
                  Edit
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => setConfirmDelete(p)}>
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">
                {modal === 'create' ? 'Add Product' : 'Edit Product'}
              </h2>
              <button className="modal__close" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <div className="modal__body">
              <div className="form-group">
                <label className="form-group__label">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. DT Label Roll 4x6"
                />
              </div>

              <div className="form-group">
                <label className="form-group__label">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g. Direct Thermal Labels"
                />
              </div>

              <div className="form-group">
                <label className="form-group__label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Product description..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-group__label">Price</label>
                  <input
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g. ₹175 + GST per roll"
                  />
                </div>
                <div className="form-group">
                  <label className="form-group__label">MOQ</label>
                  <input
                    value={form.moq}
                    onChange={(e) => setForm((prev) => ({ ...prev, moq: e.target.value }))}
                    placeholder="e.g. 100 rolls"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-group__label">In Stock</label>
                <div
                  className={`toggle ${form.inStock ? 'toggle--active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, inStock: !prev.inStock }))}
                >
                  <div className="toggle__knob" />
                </div>
              </div>

              {/* Specifications */}
              <div className="form-group">
                <label className="form-group__label">Specifications</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input placeholder="Key" value={specKey} onChange={(e) => setSpecKey(e.target.value)} style={{ flex: 1 }} />
                  <input placeholder="Value" value={specVal} onChange={(e) => setSpecVal(e.target.value)} style={{ flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && addSpec()} />
                  <button className="btn btn--secondary btn--sm" onClick={addSpec}>
                    <Plus size={14} />
                  </button>
                </div>
                {Object.keys(form.specifications).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {Object.entries(form.specifications).map(([k, v]) => (
                      <span key={k} className="product-card__spec" style={{ cursor: 'pointer' }} onClick={() => removeSpec(k)} title="Click to remove">
                        {k}: {v} <X size={10} style={{ display: 'inline', verticalAlign: '-1px', marginLeft: '4px' }} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Applications */}
              <div className="form-group">
                <label className="form-group__label">Applications (comma-separated)</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input placeholder="e.g. Shipping, E-commerce" value={appInput} onChange={(e) => setAppInput(e.target.value)} style={{ flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && addApplication()} />
                  <button className="btn btn--secondary btn--sm" onClick={addApplication}>
                    <Plus size={14} />
                  </button>
                </div>
                {form.applications.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {form.applications.map((app) => (
                      <span key={app} className="product-card__spec" style={{ cursor: 'pointer' }} onClick={() => removeApplication(app)} title="Click to remove">
                        {app} <X size={10} style={{ display: 'inline', verticalAlign: '-1px', marginLeft: '4px' }} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : modal === 'create' ? 'Create Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="confirm-dialog">
              <div className="confirm-dialog__icon">
                <Trash2 />
              </div>
              <div className="confirm-dialog__title">Delete Product</div>
              <div className="confirm-dialog__text">
                Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This action cannot be undone.
              </div>
              <div className="confirm-dialog__actions">
                <button className="btn btn--secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button className="btn btn--danger" onClick={() => handleDelete(confirmDelete._id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
