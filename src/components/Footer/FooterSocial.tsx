import React from 'react';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

interface FooterSocialProps {
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
}

export function FooterSocial({ socialLinks }: FooterSocialProps) {
  if (!socialLinks) return null;

  return (
    <div className="flex items-center space-x-6">
      {socialLinks.facebook && (
        <a
          href={socialLinks.facebook}
          className="text-gray-400 hover:text-gray-500"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
        >
          <Facebook className="w-6 h-6" />
        </a>
      )}
      {socialLinks.twitter && (
        <a
          href={socialLinks.twitter}
          className="text-gray-400 hover:text-gray-500"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Twitter"
        >
          <Twitter className="w-6 h-6" />
        </a>
      )}
      {socialLinks.instagram && (
        <a
          href={socialLinks.instagram}
          className="text-gray-400 hover:text-gray-500"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <Instagram className="w-6 h-6" />
        </a>
      )}
      {socialLinks.youtube && (
        <a
          href={socialLinks.youtube}
          className="text-gray-400 hover:text-gray-500"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
        >
          <Youtube className="w-6 h-6" />
        </a>
      )}
    </div>
  );
}