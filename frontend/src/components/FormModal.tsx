import React, { useState } from 'react'
import './FormModal.css'

interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'textarea' | 'select'
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string | number; label: string }>
  validation?: (value: any) => string | null
}

interface FormModalProps {
  isOpen: boolean
  title: string
  fields: FormField[]
  initialValues?: Record<string, any>
  onSubmit: (values: Record<string, any>) => Promise<void> | void
  onClose: () => void
  submitLabel?: string
  loading?: boolean
}

const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  title,
  fields,
  initialValues = {},
  onSubmit,
  onClose,
  submitLabel = 'Salvar',
  loading = false
}) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const newErrors: Record<string, string> = {}
    fields.forEach(field => {
      if (field.required && !values[field.name]) {
        newErrors[field.name] = `${field.label} é obrigatório`
      } else if (field.validation) {
        const error = field.validation(values[field.name])
        if (error) newErrors[field.name] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSubmitting(false)
      return
    }

    try {
      await onSubmit(values)
      setValues(initialValues)
      onClose()
    } catch (err: any) {
      setErrors({ submit: err.message || 'Erro ao salvar' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {errors.submit && <div className="form-error-message">{errors.submit}</div>}

          {fields.map(field => (
            <div key={field.name} className="form-group">
              <label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={values[field.name] || ''}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  rows={4}
                  className={errors[field.name] ? 'input-error' : ''}
                />
              ) : field.type === 'select' ? (
                <select
                  id={field.name}
                  name={field.name}
                  value={values[field.name] || ''}
                  onChange={handleChange}
                  className={errors[field.name] ? 'input-error' : ''}
                >
                  <option value="">Selecione...</option>
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={field.name}
                  type={field.type}
                  name={field.name}
                  value={values[field.name] || ''}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className={errors[field.name] ? 'input-error' : ''}
                />
              )}

              {errors[field.name] && <span className="field-error">{errors[field.name]}</span>}
            </div>
          ))}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || loading}>
              {submitting ? 'Salvando...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormModal
