import React from 'react';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Announcement {
  _id: string;
  text: string;
  url?: string;
  icon: string;
  isActive: boolean;
  order: number;
  description?: string;
}

interface AnnouncementListProps {
  announcements: Announcement[];
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
  onDragEnd: (result: any) => void;
}

export function AnnouncementList({ 
  announcements, 
  onEdit, 
  onDelete, 
  onDragEnd 
}: AnnouncementListProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="announcements">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-4"
          >
            {announcements.map((announcement, index) => (
              <Draggable
                key={announcement._id}
                draggableId={announcement._id}
                index={index}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="bg-white rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="p-4 flex items-center gap-4">
                      <div
                        {...provided.dragHandleProps}
                        className="cursor-move text-gray-400 hover:text-gray-600"
                      >
                        <GripVertical className="w-5 h-5" />
                      </div>

                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{announcement.text}</p>
                        {announcement.description && (
                          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{announcement.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            announcement.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {announcement.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-sm text-gray-500">
                            Icon: {announcement.icon}
                          </span>
                          {announcement.url && (
                            <a
                              href={announcement.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:underline"
                            >
                              Link
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(announcement)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDelete(announcement._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}