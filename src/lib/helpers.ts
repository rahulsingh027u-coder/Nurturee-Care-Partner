// ── Shared Helpers ───────────────────────────────────────────────────

export function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function formatCurrency(value: number): string {
  return `\u20b9${value.toLocaleString('en-IN')}`;
}

export function getFamilyLabel(category: string): string {
  return category === 'child_care'
    ? "Child's Parent"
    : "Elder's Family Member";
}

// ── Avatar Helpers ────────────────────────────────────────────────────

const avatarColors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

const avatarColorMap: Record<string, string> = {};

export function getAvatarColor(name: string): string {
  if (avatarColorMap[name]) return avatarColorMap[name];
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % avatarColors.length;
  avatarColorMap[name] = avatarColors[idx];
  return avatarColorMap[name];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ── Patient Helpers ──────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function careTypeLabel(careType: string): string {
  if (careType === 'post_surgical') return 'Post-Surgical Care';
  if (careType === 'dementia') return 'Dementia Care';
  if (careType === 'chronic') return 'Chronic Illness Management';
  if (careType === 'stroke') return 'Stroke Recovery';
  if (careType === 'palliative') return 'Palliative Care';
  if (careType === 'companion') return 'Companion Care';
  if (careType === 'newborn') return 'Newborn Care';
  if (careType === 'toddler') return 'Toddler Care';
  if (careType === 'special_needs') return 'Special Needs Care';
  if (careType === 'after_school') return 'After-School Care';
  return careType
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
