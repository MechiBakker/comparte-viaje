import { useId, useMemo, useState } from 'react';
import { ARGENTINE_CITIES } from '../data/cities';

const MAX_RESULTS = 6;

// Quita tildes y pasa a minúsculas: "cordoba" encuentra "Córdoba".
function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// "La Plata, Buenos Aires" -> { name: "La Plata", province: "Buenos Aires" }
function splitCity(city) {
  const i = city.lastIndexOf(', ');
  return i === -1
    ? { name: city, province: '' }
    : { name: city.slice(0, i), province: city.slice(i + 2) };
}

// Campo de texto con sugerencias de ciudades mientras se escribe.
// Sigue siendo texto libre: se puede escribir una ciudad que no figure.
export default function CityInput({ value, onChange, ...inputProps }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();

  const matches = useMemo(() => {
    const query = normalize(value.trim());
    if (query.length < 1) return [];

    const startsWith = [];
    const contains = [];
    for (const city of ARGENTINE_CITIES) {
      const name = normalize(splitCity(city).name);
      if (name.startsWith(query)) startsWith.push(city);
      else if (normalize(city).includes(query)) contains.push(city);
    }
    return [...startsWith, ...contains].slice(0, MAX_RESULTS);
  }, [value]);

  function select(city) {
    onChange(city);
    setOpen(false);
    setActive(-1);
  }

  function handleKeyDown(e) {
    if (!open || matches.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? matches.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault(); // no enviar el formulario: solo elegir la ciudad
      select(matches[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showList = open && matches.length > 0;

  return (
    <div className="city-input">
      <input
        {...inputProps}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => setOpen(false)}
      />

      {showList && (
        // El onClick evita que, dentro de un <label>, el toque vuelva a enfocar el campo.
        <ul className="city-input__list" id={listId} role="listbox" onClick={(e) => e.preventDefault()}>
          {matches.map((city, i) => {
            const { name, province } = splitCity(city);
            return (
              <li
                key={city}
                role="option"
                aria-selected={i === active}
                className={`city-input__option ${i === active ? 'city-input__option--active' : ''}`}
                // mousedown (y no click) para elegir antes de que el campo pierda el foco
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(city);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <span>{name}</span>
                {province && <span className="city-input__province">{province}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}