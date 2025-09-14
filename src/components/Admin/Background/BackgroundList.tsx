import React from 'react';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Background {
  _id: string;
  name: string;
  type: 'color' | 'gradient' | 'pattern';
  value: string;
  isActive: boolean;
  order: number;
}

interface BackgroundListProps {
  backgrounds: Background[];
  onEdit: (background: Background) => void;
  onDelete: (id: string) => void;
  onDragEnd: (result: any) => void;
}

export function BackgroundList({ 
  backgrounds, 
  onEdit, 
  onDelete, 
  onDragEnd 
}: BackgroundListProps) {
  const getPreviewStyle = (background: Background) => {
    switch (background.type) {
      case 'color':
        return { backgroundColor: background.value };
      case 'gradient':
        return { backgroundImage: background.value };
      case 'pattern':
        return { 
          backgroundImage: `url(${background.value})`,
          backgroundSize: 'cover'
        };
      default:
        return {};
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="backgrounds">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-4"
          >
            {backgrounds.map((background, index) => (
              <Draggable
                key={background._id}
                draggableId={background._id}
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

                      <div 
                        className="w-16 h-16 rounded-lg"
                        style={getPreviewStyle(background)}
                      />

                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{background.name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            background.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {background.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-sm text-gray-500 capitalize">
                            Type: {background.type}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(background)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDelete(background._id)}
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