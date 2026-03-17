import { useRef, useState, useCallback, useEffect } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { geoapifyAutocomplete, type GeoapifyPlace } from '@/hooks/useGoogleMaps';

export interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  id?: string;
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search for a location...',
  disabled = false,
  className,
  icon,
  id,
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<GeoapifyPlace[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Debounced autocomplete search
  useEffect(() => {
    if (!value || value.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await geoapifyAutocomplete(value);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = useCallback(
    (place: GeoapifyPlace) => {
      const result: PlaceResult = {
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        placeId: place.placeId,
      };
      onChange(result.address);
      onPlaceSelect(result);
      setShowDropdown(false);
      setSuggestions([]);
    },
    [onChange, onPlaceSelect],
  );

  const handleClear = useCallback(() => {
    onChange('');
    onPlaceSelect({ address: '', lat: 0, lng: 0, placeId: '' });
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  }, [onChange, onPlaceSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || suggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        handleSelect(suggestions[activeIndex]);
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    },
    [showDropdown, suggestions, activeIndex, handleSelect],
  );

  return (
    <div className="relative">
      {/* Left icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted z-10">
        {isSearching ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          icon || <MapPin className="h-5 w-5" />
        )}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={cn(
          'flex w-full h-12 rounded-xl border bg-surface text-text-primary px-4 py-3 text-base pl-10',
          'ring-offset-background placeholder:text-text-muted',
          'focus-visible:outline-none transition-all duration-200',
          isFocused
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-border hover:border-border-hover',
          disabled && 'cursor-not-allowed opacity-50',
          value && 'pr-10',
          className,
        )}
      />

      {/* Clear button */}
      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-border bg-surface shadow-lg"
        >
          {suggestions.map((place, index) => (
            <button
              key={place.placeId || index}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(place);
              }}
              className={cn(
                'flex items-start gap-3 w-full px-4 py-3 text-left transition-colors',
                index === activeIndex
                  ? 'bg-primary/10 text-text-primary'
                  : 'hover:bg-background-elevated text-text-secondary',
                index < suggestions.length - 1 && 'border-b border-border/50',
              )}
            >
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-text-muted" />
              <span className="text-sm leading-snug">{place.address}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
