import { useState, useRef } from 'react'
import { uploadImage } from '../../lib/uploadImage'

export default function ImageUpload({ label = 'Attach image', value, onChange, folder = 'trade-screenshots' }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || null)
  const inputRef = useRef()

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const url = await uploadImage(file, folder)
      setPreview(url)
      onChange(url)
    } catch (err) {
      setPreview(null)
      onChange(null)
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    setPreview(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-border" />
          {uploading && (
            <div className="absolute inset-0 bg-card/70 rounded-lg flex items-center justify-center">
              <span className="text-xs text-text-secondary">Uploading...</span>
            </div>
          )}
          {!uploading && (
            <button type="button" onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-loss text-surface rounded-full w-5 h-5 text-xs flex items-center justify-center shadow">
              x
            </button>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="w-full py-3 border-2 border-dashed border-border-light rounded-lg text-sm text-text-muted hover:border-accent-muted hover:text-accent transition-colors">
          {uploading ? 'Uploading...' : 'Tap to upload'}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
    </div>
  )
}
