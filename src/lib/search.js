/** Case-insensitive match of every search word against name, description, category and tags. */
export function matchesQuery(project, query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [project.name, project.description, project.category, ...(project.tags ?? [])]
    .join(' ')
    .toLowerCase();
  return words.every((w) => haystack.includes(w));
}

export function filterProjects(projects, { query = '', category = null } = {}) {
  return projects.filter((p) => (!category || p.category === category) && matchesQuery(p, query));
}

/** Unique categories, sorted, with "Other" last. */
export function categoriesOf(projects) {
  const counts = new Map();
  for (const p of projects) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => (a.name === 'Other') - (b.name === 'Other') || a.name.localeCompare(b.name));
}
