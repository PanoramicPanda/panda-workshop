import { useEffect, useMemo, useState } from 'react';
import projects from './generated/projects.json';
import Header from './components/Header.jsx';
import SearchBar from './components/SearchBar.jsx';
import CategoryFilter from './components/CategoryFilter.jsx';
import ProjectGallery from './components/ProjectGallery.jsx';
import EmptyState from './components/EmptyState.jsx';
import Footer from './components/Footer.jsx';
import { categoriesOf, filterProjects } from './lib/search.js';

function readUrlState() {
  const params = new URLSearchParams(window.location.search);
  return { query: params.get('q') ?? '', category: params.get('category') || null };
}

export default function App() {
  const [{ query, category }, setFilters] = useState(readUrlState);
  const categories = useMemo(() => categoriesOf(projects), []);
  const activeCategory = categories.some((c) => c.name === category) ? category : null;
  const filtering = query.trim() !== '' || activeCategory !== null;

  // Keep filters in the URL so searches can be bookmarked or shared.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (activeCategory) params.set('category', activeCategory);
    const search = params.toString();
    window.history.replaceState(null, '', search ? `?${search}` : window.location.pathname);
  }, [query, activeCategory]);

  const featured = projects.filter((p) => p.featured);
  const results = filterProjects(projects, { query, category: activeCategory });
  const clear = () => setFilters({ query: '', category: null });

  return (
    <>
      <a className="skip-link" href="#projects">Skip to projects</a>
      <Header count={projects.length} />

      <main id="main">
        {projects.length === 0 ? (
          <EmptyState
            icon="🌱"
            title="The workshop is just getting set up"
            message="No projects have been published yet. Check back soon — little things are on the way."
          />
        ) : (
          <>
            {!filtering && featured.length > 0 && (
              <section className="section" aria-labelledby="featured-heading">
                <div className="section-head">
                  <h2 id="featured-heading">Featured</h2>
                </div>
                <ProjectGallery projects={featured} variant="featured" />
              </section>
            )}

            <section className="section" id="projects" aria-labelledby="all-heading" tabIndex={-1}>
              <div className="section-head">
                <h2 id="all-heading">{filtering ? 'Results' : 'All projects'}</h2>
                <p className="result-count" aria-live="polite">
                  {results.length} of {projects.length}
                </p>
              </div>

              <div className="controls">
                <SearchBar value={query} onChange={(q) => setFilters((f) => ({ ...f, query: q }))} />
                {categories.length > 1 && (
                  <CategoryFilter
                    categories={categories}
                    active={activeCategory}
                    total={projects.length}
                    onChange={(c) => setFilters((f) => ({ ...f, category: c }))}
                  />
                )}
              </div>

              {results.length > 0 ? (
                <ProjectGallery projects={results} />
              ) : (
                <EmptyState
                  icon="🔍"
                  title="Nothing matches that"
                  message={
                    query.trim()
                      ? `No projects match “${query.trim()}”${activeCategory ? ` in ${activeCategory}` : ''}.`
                      : `No projects in ${activeCategory} yet.`
                  }
                  action={{ label: 'Clear filters', onClick: clear }}
                />
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
