import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    createSeed,
    getSeedById,
    getSuppliers,
    updateSeed,
} from '../seedApi.js';
import { FIELD_LABELS, SEED_FORM_INITIAL_VALUES, validateSeedForm } from '../seedValidation.js';
import './SeedForm.css';

function SeedFormPage() {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();

    const [values, setValues] = useState(SEED_FORM_INITIAL_VALUES);
    const [errors, setErrors] = useState({});
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        getSuppliers()
            .then(setSuppliers)
            .catch(() => setSuppliers([]));
    }, []);

    useEffect(() => {
        if (!isEditing) return;

        getSeedById(id)
            .then((seed) => {
                setValues({
                    plantName: seed.plantName || '',
                    variety: seed.variety || '',
                    supplierId: seed.supplierId ? String(seed.supplierId) : '',
                    quantity: seed.quantity ? String(seed.quantity) : '',
                    acquisitionDate: seed.acquisitionDate || '',
                    expirationDate: seed.expirationDate || '',
                    notes: seed.notes || '',
                });
            })
            .catch(() => {
                setSubmitMessage({
                    type: 'error',
                    text: 'No se pudo cargar la semilla solicitada.',
                });
            })
            .finally(() => setIsLoading(false));
    }, [id, isEditing]);

    function handleChange(field) {
        return (e) => {
            setValues((prev) => ({ ...prev, [field]: e.target.value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        };
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validateSeedForm(values, isEditing);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            const readableFieldNames = Object.keys(validationErrors)
                .map((field) => FIELD_LABELS[field] || field)
                .join(', ');
            setSubmitMessage({
                type: 'error',
                text: `Revisa los campos marcados: ${readableFieldNames}.`,
            });
            return;
        }

        const payload = {
            plantName: values.plantName.trim(),
            variety: values.variety.trim(),
            supplierId: values.supplierId,
            quantity: Number(values.quantity),
            acquisitionDate: values.acquisitionDate,
            expirationDate: values.expirationDate || null,
            notes: values.notes.trim(),
        };

        setIsSubmitting(true);
        try {
            if (isEditing) {
                await updateSeed(id, payload);
                setSubmitMessage({ type: 'success', text: 'Semilla modificada exitosamente.' });
            } else {
                await createSeed(payload);
                setSubmitMessage({ type: 'success', text: 'Semilla registrada exitosamente.' });
                setValues(SEED_FORM_INITIAL_VALUES);
            }
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text:
                    err.response?.data?.message ||
                    'No se pudo guardar la semilla. Intenta nuevamente.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="seed-form-loading">Cargando información de la semilla...</div>;
    }

    return (
        <div className="seed-form-page">
            <div className="seed-form-card">
                <h2>{isEditing ? 'Modificar semilla' : 'Registrar semilla'}</h2>
                <p className="seed-form-subtitle">
                    {isEditing
                        ? 'Actualiza la información de esta semilla en el inventario.'
                        : 'Completa los datos para agregar una nueva semilla al inventario.'}
                </p>

                <form onSubmit={handleSubmit} className="seed-form" noValidate>
                    <div className="seed-form-row">
                        <label className="seed-field">
                            <span>Nombre de la planta *</span>
                            <input
                                type="text"
                                maxLength={50}
                                value={values.plantName}
                                onChange={handleChange('plantName')}
                                placeholder="Ej. Tomate"
                            />
                            {errors.plantName && <small className="field-error">{errors.plantName}</small>}
                        </label>

                        <label className="seed-field">
                            <span>Variedad *</span>
                            <input
                                type="text"
                                maxLength={50}
                                value={values.variety}
                                onChange={handleChange('variety')}
                                placeholder="Ej. Cherry"
                            />
                            {errors.variety && <small className="field-error">{errors.variety}</small>}
                        </label>
                    </div>

                    <div className="seed-form-row">
                        <label className="seed-field">
                            <span>Proveedor *</span>
                            <select value={values.supplierId} onChange={handleChange('supplierId')}>
                                <option value="">Selecciona un proveedor</option>
                                {suppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                            {errors.supplierId && (
                                <small className="field-error">{errors.supplierId}</small>
                            )}
                        </label>

                        <label className="seed-field">
                            <span>Cantidad adquirida *</span>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={values.quantity}
                                onChange={handleChange('quantity')}
                                placeholder="Ej. 100"
                            />
                            {errors.quantity && <small className="field-error">{errors.quantity}</small>}
                        </label>
                    </div>

                    <div className="seed-form-row">
                        <label className="seed-field">
                            <span>Fecha de adquisición *</span>
                            <input
                                type="date"
                                value={values.acquisitionDate}
                                onChange={handleChange('acquisitionDate')}
                            />
                            {errors.acquisitionDate && (
                                <small className="field-error">{errors.acquisitionDate}</small>
                            )}
                        </label>

                        <label className="seed-field">
                            <span>Fecha de vencimiento {isEditing ? '*' : '(opcional)'}</span>
                            <input
                                type="date"
                                value={values.expirationDate}
                                onChange={handleChange('expirationDate')}
                            />
                            {errors.expirationDate && (
                                <small className="field-error">{errors.expirationDate}</small>
                            )}
                        </label>
                    </div>

                    <label className="seed-field">
                        <span>Observaciones (opcional)</span>
                        <textarea
                            maxLength={200}
                            rows={3}
                            value={values.notes}
                            onChange={handleChange('notes')}
                            placeholder="Notas adicionales sobre esta semilla..."
                        />
                        {errors.notes && <small className="field-error">{errors.notes}</small>}
                    </label>

                    {submitMessage && (
                        <div className={`seed-form-message ${submitMessage.type}`}>
                            {submitMessage.text}
                        </div>
                    )}

                    <div className="seed-form-actions">
                        <button
                            type="button"
                            className="seed-button secondary"
                            onClick={() => navigate('/seeds')}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="seed-button primary" disabled={isSubmitting}>
                            {isSubmitting
                                ? 'Guardando...'
                                : isEditing
                                ? 'Guardar cambios'
                                : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SeedFormPage;
