import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

export default function FancySelect({
  value,
  onChange,
  options = [],
  placeholder = 'Pilih...',
  disabled = false,
  icon = null,
  emptyLabel = 'Belum ada pilihan',
  className = '',
  menuPlacement = 'auto',
}) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState(null)
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)
  const selected = options.find((option) => option.value === value)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openUpward =
      menuPlacement === 'top' ||
      (menuPlacement === 'auto' && spaceAbove > spaceBelow)

    setDropdownStyle(
      openUpward
        ? {
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            bottom: window.innerHeight - rect.top + 8,
            zIndex: 9999,
          }
        : {
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            top: rect.bottom + 8,
            zIndex: 9999,
          }
    )
  }, [open, menuPlacement])

  useEffect(() => {
    if (!open) return
    const handleClose = (event) => {
      const inTrigger = triggerRef.current?.contains(event.target)
      const inDropdown = dropdownRef.current?.contains(event.target)
      if (!inTrigger && !inDropdown) setOpen(false)
    }
    document.addEventListener('mousedown', handleClose)
    return () => document.removeEventListener('mousedown', handleClose)
  }, [open])

  const handleSelect = (option) => {
    onChange(option.value, option)
    setOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl border bg-field px-3.5 py-2.5 text-left transition-all duration-200 ${
          open
            ? 'border-text shadow-[0_0_0_4px_rgb(var(--color-primary)_/_0.22)]'
            : 'border-text/15 hover:border-border2 hover:bg-surface'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg text-muted">
            {icon}
          </div>
        )}
        {selected?.swatch && (
          <span
            className="h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-bg"
            style={{ backgroundColor: selected.swatch }}
            aria-hidden="true"
          />
        )}
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm font-black ${selected ? 'text-text' : 'text-muted2'}`}>
            {selected?.label || placeholder}
          </span>
          {(selected?.description || (!selected && emptyLabel)) && (
            <span className="mt-0.5 block truncate text-[11px] font-semibold text-muted">
              {selected?.description || emptyLabel}
            </span>
          )}
        </span>
        <ChevronDown
          size={18}
          strokeWidth={2.5}
          className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && dropdownStyle && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="max-h-64 overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-2xl shadow-black/10 animate-soft-pop custom-scrollbar"
          role="listbox"
        >
          {options.length > 0 ? (
            options.map((option) => {
              const active = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(option)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    active ? 'bg-primary-pale text-text' : 'text-text hover:bg-bg'
                  }`}
                  role="option"
                  aria-selected={active}
                >
                  {option.swatch && (
                    <span
                      className="h-3 w-3 shrink-0 rounded-full ring-4 ring-surface"
                      style={{ backgroundColor: option.swatch }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{option.label}</span>
                    {option.description && (
                      <span className="mt-0.5 block truncate text-[11px] font-semibold text-muted">
                        {option.description}
                      </span>
                    )}
                  </span>
                  {active && <Check size={16} strokeWidth={2.6} className="shrink-0 text-income" />}
                </button>
              )
            })
          ) : (
            <div className="px-3 py-3 text-sm font-semibold text-muted">{emptyLabel}</div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
