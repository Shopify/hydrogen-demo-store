type Listener = () => void;

const listeners = new Set<Listener>();

export function openCartDrawer() {
  for (const listener of listeners) {
    listener();
  }
}

export function onOpenCartDrawer(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
