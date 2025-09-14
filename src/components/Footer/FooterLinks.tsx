import React from 'react';
import { Link } from 'react-router-dom';

interface FooterLink {
  _id: string;
  name: string;
  url: string;
  section: 'shop' | 'support' | 'company';
  isActive: boolean;
}

interface FooterLinksProps {
  links: FooterLink[];
  section: string;
  title: string;
}

export function FooterLinks({ links, section, title }: FooterLinksProps) {
  const sectionLinks = links.filter(link => link.section === section && link.isActive);

  if (sectionLinks.length === 0) return null;

  return (
    <div className="space-y-4">
      <details className="group md:open">
        <summary className="flex items-center justify-between cursor-pointer md:cursor-default">
          <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
            {title}
          </h3>
        </summary>
        <ul className="mt-4 space-y-3 group-open:animate-fadeIn">
          {sectionLinks.map((link) => (
            <li key={link._id}>
              <Link
                to={link.url}
                className="text-base text-gray-600 hover:text-gray-900"
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}