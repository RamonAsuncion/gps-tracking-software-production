import React from 'react'
import { iconMap } from '../utils/iconMap'

interface AccessoryIconProps {
  icon: string
  color: string
  onClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
}

const AccessoryIcon = React.forwardRef<HTMLDivElement, AccessoryIconProps>(
  ({ icon, color, onClick }, ref) => {
    const IconComponent = iconMap[icon]
    return (
      <div
        ref={ref}
        className='w-9 h-9 rounded-full border-3 border-solid flex items-center justify-center flex-shrink-0'
        style={{ borderColor: color, backgroundColor: '#eaeaea' }}
        onClick={onClick}
      >
        {IconComponent}
      </div>
    )
  },
)

export default AccessoryIcon
