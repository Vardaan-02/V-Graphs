
import React from 'react';
import { FloatingAddButton } from './_components/addButton';
import { useDragContext } from '@/provider/dragprovider';
import NodePalettePanel from './_components/nonCollapsiblePannel';

const NodePalette: React.FC = () => {
  const { togglePalette, isPaletteOpen, setIsPaletteOpen } = useDragContext();


  const handleToggle = () => {
    if (togglePalette) {
      togglePalette();
    } else if (setIsPaletteOpen) {
      setIsPaletteOpen(!isPaletteOpen);
    }
  };

  const handleClose = () => {
    if (setIsPaletteOpen) {
      setIsPaletteOpen(false);
    }
  };

  return (
    <div className="h-screen bg-transparent relative">
      <FloatingAddButton 
        onClick={handleToggle}
        isOpen={isPaletteOpen ?? false}
      />
      <NodePalettePanel
        isOpen={isPaletteOpen ?? false}
        onClose={handleClose}
      />
    </div>
  );
};

export default NodePalette;