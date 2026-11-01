/* eslint-disable react/prop-types */
import { Moon, X } from 'lucide-react'

// Active promotion, shown inline under the page header. Dismissible.
export const PromoBanner = ({ title, message, onClose }) => (
  <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-accent/50 bg-accent-soft py-3 pr-2 pl-3 animate-pop-in">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-on-accent/50 bg-accent text-on-accent outline-2 outline-offset-2 outline-accent/30 outline">
        <Moon size={18} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold leading-snug text-ink">{title}</p>
        {message && <p className="text-sm text-accent-ink">{message}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Ocultar promoción"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-accent-ink transition hover:bg-accent/20"
      >
        <X size={18} />
      </button>
    </div>
  </div>
)
