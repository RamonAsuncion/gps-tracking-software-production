import React from 'react'
import { UIMap } from '../utils/iconMap'
interface MapControlsProps {
  onZoomIn: (event: React.MouseEvent<HTMLButtonElement>) => void
  onZoomOut: (event: React.MouseEvent<HTMLButtonElement>) => void
}

const MapControls: React.FC<MapControlsProps> = ({ onZoomIn, onZoomOut }) => {
  return (
    <div className='absolute bottom-0 right-0 m-4 flex items-center bg-gray-200 rounded-full p-0.5'>
      <button className='p-1 rounded-full text-custom-text' onClick={onZoomOut}>
        {UIMap.zoomOut}
      </button>
      <button
        className='p-1 rounded-full text-custom-text ml-2'
        onClick={onZoomIn}
      >
        {UIMap.zoomIn}
      </button>
    </div>
  )
}

export default MapControls
