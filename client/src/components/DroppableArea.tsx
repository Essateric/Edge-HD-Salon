import React from 'react';
import { Droppable, DroppableProps, DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';

// Fixed DroppableArea component to avoid React Fragment issues
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

  // Critical fix: Remove children from cleanProps to avoid React Fragment issues
  // Create a clean props object without children
  const cleanProps: Omit<DroppableProps, 'children'> = {
    droppableId,
    type,
    mode,
    direction,
    isDropDisabled,
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
        try {
          // Wrap the original render function to ensure placeholder is always included
          if (typeof children === 'function') {
            // When there's a drag operation, we need to make sure the DOM is fully prepared
            if (snapshot.isDraggingOver) {
              // Add visual feedback to the droppable area being dragged over
              setTimeout(() => {
                try {
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
                } catch (err) {
                  console.warn('Error adding highlight class:', err);
                }
              }, 0); // Using setTimeout with 0 delay to run after the current execution
            }
            
            // Call the children function with provided and snapshot
            return children(provided, snapshot);
          }
          
          // Fallback for direct children (though this component typically uses function children)
          return (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="droppable-container"
            >
              {children}
              {provided.placeholder}
            </div>
          );
        } catch (error) {
          console.error('Error in DroppableArea:', error);
          // Provide a fallback UI in case of errors
          return (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="droppable-error-container"
            >
              <div className="error-message">Error rendering droppable content</div>
              {provided.placeholder}
            </div>
          );
        }
      }}
    </Droppable>
  );
};

export default DroppableArea;