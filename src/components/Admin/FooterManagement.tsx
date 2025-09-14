import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, Link as LinkIcon } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { FooterLinkModal } from './FooterLinkModal';

interface FooterLink {
  _id: string;
  name: string;
  url: string;
  section: 'shop' | 'support' | 'company';
  order: number;
  isActive: boolean;
}

interface FooterSection {
  id: string;
  name: string;
  links: FooterLink[];
}

export function FooterManagement() {
  const [sections, setSections] = useState<FooterSection[]>([
    { id: 'shop', name: 'Shop', links: [] },
    { id: 'support', name: 'Support', links: [] },
    { id: 'company', name: 'Company', links: [] }
  ]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<FooterLink | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('shop');

  useEffect(() => {
    fetchFooterLinks();
  }, []);

  const fetchFooterLinks = async () => {
    try {
      const response = await api.get('/footer/links');
      const links = response.data;

      // Group links by section
      const updatedSections = sections.map(section => ({
        ...section,
        links: links
          .filter(link => link.section === section.id)
          .sort((a, b) => a.order - b.order)
      }));

      setSections(updatedSections);
    } catch (error) {
      toast.error('Failed to fetch footer links');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const sourceSection = sections.find(s => s.id === result.source.droppableId);
    const destSection = sections.find(s => s.id === result.destination.droppableId);

    if (!sourceSection || !destSection) return;

    const newSections = [...sections];
    const sourceLinks = [...sourceSection.links];
    const destLinks = sourceSection === destSection ? sourceLinks : [...destSection.links];

    const [movedLink] = sourceLinks.splice(result.source.index, 1);
    destLinks.splice(result.destination.index, 0, movedLink);

    // Update orders
    const updatedLinks = destLinks.map((link, index) => ({
      ...link,
      order: index,
      section: destSection.id
    }));

    // Update sections state
    if (sourceSection === destSection) {
      newSections.find(s => s.id === sourceSection.id)!.links = updatedLinks;
    } else {
      newSections.find(s => s.id === sourceSection.id)!.links = sourceLinks;
      newSections.find(s => s.id === destSection.id)!.links = updatedLinks;
    }

    setSections(newSections);

    try {
      await api.put('/footer/links/reorder', {
        links: updatedLinks.map(link => ({
          id: link._id,
          order: link.order,
          section: link.section
        }))
      });
    } catch (error) {
      toast.error('Failed to update link order');
      fetchFooterLinks(); // Revert to original order
    }
  };

  const handleCreateLink = async (formData: Partial<FooterLink>) => {
    try {
      const response = await api.post('/footer/links', {
        ...formData,
        section: selectedSection,
        order: sections.find(s => s.id === selectedSection)?.links.length || 0
      });

      setSections(prev => prev.map(section => 
        section.id === selectedSection
          ? { ...section, links: [...section.links, response.data] }
          : section
      ));

      toast.success('Footer link created successfully');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to create footer link');
    }
  };

  const handleUpdateLink = async (id: string, formData: Partial<FooterLink>) => {
    try {
      const response = await api.put(`/footer/links/${id}`, formData);
      
      setSections(prev => prev.map(section => ({
        ...section,
        links: section.links.map(link => 
          link._id === id ? response.data : link
        )
      })));

      toast.success('Footer link updated successfully');
      setIsModalOpen(false);
      setSelectedLink(null);
    } catch (error) {
      toast.error('Failed to update footer link');
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return;

    try {
      await api.delete(`/footer/links/${id}`);
      
      setSections(prev => prev.map(section => ({
        ...section,
        links: section.links.filter(link => link._id !== id)
      })));

      toast.success('Footer link deleted successfully');
    } catch (error) {
      toast.error('Failed to delete footer link');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Footer Management</h1>
        <button
          onClick={() => {
            setSelectedLink(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Link
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          {sections.map((section) => (
            <Droppable key={section.id} droppableId={section.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {section.name}
                    </h2>
                    <button
                      onClick={() => {
                        setSelectedSection(section.id);
                        setSelectedLink(null);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {section.links.map((link, index) => (
                      <Draggable
                        key={link._id}
                        draggableId={link._id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 rounded-lg border ${
                              link.isActive 
                                ? 'bg-white border-gray-200' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <LinkIcon className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">
                                  {link.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedLink(link);
                                    setIsModalOpen(true);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLink(link._id)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <a 
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 text-sm text-gray-500 hover:text-gray-700"
                            >
                              {link.url}
                            </a>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>

      <FooterLinkModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLink(null);
        }}
        onSubmit={selectedLink 
          ? (data) => handleUpdateLink(selectedLink._id, data)
          : handleCreateLink
        }
        link={selectedLink}
        section={selectedSection}
      />
    </div>
  );
}