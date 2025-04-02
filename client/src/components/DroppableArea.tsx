import React from 'react';
import { Droppable, DroppableProps, DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';

// Enhanced DroppableArea component
const DroppableArea: React.FC<DroppableProps> = (props) => {
  // Extract all necessary props with defaults to avoid defaultProps warnings
  const {
    droppableId,
    type = 'DEFAULT',
    mode = 'standard',
    direction = 'vertical',
    isDropDisabled = false,
    isCombineEnabled = false,
    ignoreContainerClipping = false,
    children,
    renderClone,
    getContainerForClone,
  } = props;

  // Create a clean props object
  const cleanProps: DroppableProps = {
    droppableId,
    type,
    mode,
    direction,
    isDropDisabled,
    children,
  };

  // Only add optional props when explicitly provided
  if (isCombineEnabled) cleanProps.isCombineEnabled = isCombineEnabled;
  if (ignoreContainerClipping) cleanProps.ignoreContainerClipping = ignoreContainerClipping;
  if (renderClone) cleanProps.renderClone = renderClone;
  if (getContainerForClone) cleanProps.getContainerForClone = getContainerForClone;

  // Enhanced wrapper to ensure proper rendering of children with snapshot
  return (
    <Droppable {...cleanProps}>
      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => {
        // Wrap the original render function to ensure placeholder is always included
        if (typeof children === 'function') {
          // When there's a drag operation, we need to make sure the DOM is fully prepared
          if (snapshot.isDraggingOver) {
            console.log(`Dragging over ${droppableId}`, snapshot);
            
            // Add visual feedback to the droppable area being dragged over
            setTimeout(() => {
              // Find all time-slot elements inside this droppable
              const droppableEl = document.querySelector(`[data-rbd-droppable-id="${droppableId}"]`);
              if (droppableEl) {
                const timeSlot = droppableEl.closest('.time-slot');
                if (timeSlot) {
                  // Add a class to highlight this specific time slot
                  timeSlot.classList.add('edgesalon-over');
                  
                  // Clean up the highlight after a short delay if the drag moves elsewhere
                  setTimeout(() => {
                    if (!snapshot.isDraggingOver) {
                      timeSlot.classList.remove('edgesalon-over');
                    }
                  }, 300);
                }
              }
            }, 0); // Using setTimeout with 0 delay to run after the current execution
          }
          
          const childrenResult = children(provided, snapshot);
          
          // Don't use a fragment here to avoid data-replit-metadata error
          // Instead, return the children directly and let the parent component handle the placeholder
          return childrenResult;
        }
        
        // Fallback for direct children (though this component typically uses function children)
        return (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {children}
            {provided.placeholder}
          </div>
        );
      }}
    </Droppable>
  );
};

export default DroppableArea;