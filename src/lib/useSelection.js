import { useState, useEffect, useMemo } from 'react';

/**
 * useSelection — checkbox multi-select over the current page of rows.
 * Selection resets automatically whenever the visible id set changes
 * (pagination, search, or filters).
 */
export function useSelection(pageItemIds = []) {
  const [selected, setSelected] = useState(new Set());
  const idsKey = pageItemIds.join(',');

  useEffect(() => {
    setSelected(new Set());
  }, [idsKey]);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isAllSelected = pageItemIds.length > 0 && pageItemIds.every(id => selected.has(id));

  const toggleAll = () => {
    setSelected(prev => {
      if (isAllSelected) return new Set();
      return new Set(pageItemIds);
    });
  };

  const clear = () => setSelected(new Set());

  return useMemo(() => ({
    selected,
    toggle,
    toggleAll,
    isAllSelected,
    clear,
    count: selected.size
  }), [selected, isAllSelected]);
}
