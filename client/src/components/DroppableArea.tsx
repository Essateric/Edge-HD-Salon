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
          const childrenResult = children(provided, snapshot);
          
          return (
            <>
              {childrenResult}
              {/* Ensure placeholder is always in DOM even when not rendered by children */}
              <div style={{ display: 'none' }}>{provided.placeholder}</div>
              {/* We don't need the backup placeholder as it's causing highlighting issues */}
            </>
          );
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