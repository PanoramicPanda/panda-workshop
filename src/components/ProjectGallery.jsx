import ProjectCard from './ProjectCard.jsx';

export default function ProjectGallery({ projects, variant = 'grid' }) {
  return (
    <ul className={`gallery gallery-${variant}`} role="list">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectCard project={project} featured={variant === 'featured'} />
        </li>
      ))}
    </ul>
  );
}
