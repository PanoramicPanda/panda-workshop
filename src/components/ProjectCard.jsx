import { useState } from 'react';

/** Stable small hash so each project gets its own placeholder colours. */
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function initials(name) {
  const words = name.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

function Placeholder({ project }) {
  const h = hash(project.id);
  const hue = h % 360;
  const hue2 = (hue + 40 + ((h >> 9) % 60)) % 360;
  return (
    <div
      className="thumb thumb-placeholder"
      style={{ '--h1': hue, '--h2': hue2 }}
      aria-hidden="true"
    >
      <span>{initials(project.name)}</span>
    </div>
  );
}

export default function ProjectCard({ project, featured = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = project.thumbnail && !imageFailed;

  return (
    <article className={`card${featured ? ' card-featured' : ''}`}>
      {showImage ? (
        <div className="thumb">
          <img src={project.thumbnail} alt="" loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
        </div>
      ) : (
        <Placeholder project={project} />
      )}
      <div className="card-body">
        <p className="card-category">{project.category}</p>
        <h3 className="card-title">
          <a href={project.url} className="card-link">
            {project.name}
          </a>
        </h3>
        <p className="card-description">{project.description}</p>
        {project.tags.length > 0 && (
          <ul className="tags" aria-label="Tags">
            {project.tags.map((tag) => (
              <li key={tag} className="tag">
                {tag}
              </li>
            ))}
          </ul>
        )}
        <span className="card-cta" aria-hidden="true">
          Open project →
        </span>
      </div>
    </article>
  );
}
