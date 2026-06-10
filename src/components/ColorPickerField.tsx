import {useId, useState} from 'react';
import {HexColorPicker} from 'react-colorful';
import {Palette} from 'lucide-react';

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const DEFAULT_COLOR = '#6366F1';

export function normalizeHexColor(raw: string): string {
  const trimmed = raw.trim();
  if (!HEX_COLOR_PATTERN.test(trimmed)) return '';
  return trimmed.toUpperCase();
}

export function ColorPickerField({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pickerId = useId();
  const hex = normalizeHexColor(value);
  const pickerColor = hex || DEFAULT_COLOR;

  const clearColour = () => {
    onChange('');
    setOpen(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-wrap items-start gap-3">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls={pickerId}
          className="group flex min-w-0 flex-1 flex-wrap items-center gap-4 rounded-sm border border-transparent py-1 text-left transition-colors hover:border-brand-gray-200 hover:bg-brand-gray-50/80"
        >
        <span
          className="relative size-16 shrink-0 overflow-hidden rounded-sm border-2 border-brand-gray-300 shadow-sm transition-shadow group-hover:border-brand-black group-hover:shadow-md"
          aria-hidden
        >
          {hex ? (
            <span className="block size-full" style={{backgroundColor: hex}} />
          ) : (
            <>
              <span className="absolute inset-0 bg-gradient-to-br from-rose-300 via-violet-300 to-sky-300" />
              <span className="absolute inset-0 flex items-center justify-center bg-white/25">
                <Palette size={22} strokeWidth={1.75} className="text-brand-black/70" />
              </span>
            </>
          )}
        </span>
        <span className="min-w-[8rem] space-y-0.5 text-sm">
          {hex ? (
            <>
              <span className="block font-mono font-semibold tracking-wide text-brand-black">
                {hex}
              </span>
              <span className="block text-brand-gray-500">
                {open ? 'Hide colour picker' : 'Tap to change colour'}
              </span>
            </>
          ) : (
            <>
              <span className="block font-medium text-brand-black">Choose a colour</span>
              <span className="block text-brand-gray-500">
                {open ? 'Hide colour picker' : 'Tap to open the colour picker'}
              </span>
            </>
          )}
        </span>
        </button>

        {hex ? (
          <button
            type="button"
            onClick={clearColour}
            className="shrink-0 py-2 text-sm font-medium text-brand-gray-600 underline underline-offset-2 transition-colors hover:text-brand-black"
          >
            Remove colour
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          id={pickerId}
          className="kicero-color-picker mt-4"
          role="group"
          aria-label="Colour picker"
        >
          <HexColorPicker
            color={pickerColor}
            onChange={(next) => onChange(normalizeHexColor(next))}
          />
        </div>
      ) : null}
    </div>
  );
}
