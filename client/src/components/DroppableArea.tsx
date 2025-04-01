import React, { forwardRef } from 'react';
import { Droppable, DroppableProps } from 'react-beautiful-dnd';

// Create a wrapper component for Droppable to avoid defaultProps warning
const DroppableArea: React.FC<DroppableProps> = (props) => {
  // Forward all props to the Droppable component
  // But ensure we're not passing any undefined props that could trigger defaultProps
  const {
    droppableId,
    type = 'DEFAULT', // Provide default value here instead of relying on defaultProps
    mode = 'standard', // Provide default value here
    direction,
    isDropDisabled,
    isCombineEnabled,
    ignoreContainerClipping,
    renderClone,
    getContainerForClone,
    children,
  } = props;

  // Clean props object to remove any undefined values
  const cleanProps: DroppableProps = {
    droppableId,
    children,
  };

  // Only add non-default props if they're explicitly provided
  if (type !== 'DEFAULT') cleanProps.type = type;
  if (mode !== 'standard') cleanProps.mode = mode;
  if (direction) cleanProps.direction = direction;
  if (isDropDisabled !== undefined) cleanProps.isDropDisabled = isDropDisabled;
  if (isCombineEnabled !== undefined) cleanProps.isCombineEnabled = isCombineEnabled;
  if (ignoreContainerClipping !== undefined) cleanProps.ignoreContainerClipping = ignoreContainerClipping;
  if (renderClone) cleanProps.renderClone = renderClone;
  if (getContainerForClone) cleanProps.getContainerForClone = getContainerForClone;

  return <Droppable {...cleanProps} />;
};

export default DroppableArea;