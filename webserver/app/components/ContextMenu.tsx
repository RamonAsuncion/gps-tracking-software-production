import React from 'react'

interface ContextMenuProps {
  x: number
  y: number
  hide: () => void
  onDelete: (id: string) => void
  onCopyId: (id: string) => void
  onRename: (id: string) => void
  onCopyCoordinates: (id: string) => void
  selectedAccessory: string
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  hide,
  onDelete,
  onCopyId,
  onRename,
  onCopyCoordinates,
  selectedAccessory,
}) => {
  const handleAction = (action: string) => {
    switch (action) {
      case 'delete':
        onDelete(selectedAccessory)
        hide()
        break
      case 'copyId':
        onCopyId(selectedAccessory)
        hide()
        break
      case 'rename':
        onRename(selectedAccessory)
        hide()
        break
      case 'copyCoordinates':
        onCopyCoordinates(selectedAccessory)
        hide()
        break
      default:
        console.log(`Unknown action: ${action}`)
    }
  }

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation()
  }

  return (
    <div
      className='absolute bg-white shadow-lg rounded p-2 z-10'
      style={{ top: y, left: x }}
      onContextMenu={e => e.preventDefault()}
      onClick={handleClick}
    >
      <button onClick={() => handleAction('delete')}>Delete</button>
      <div className='border-t border-gray-200 my-2'></div>
      <button onClick={() => handleAction('rename')}>Rename</button>
      <div className='border-t border-gray-200 my-2'></div>
      <button onClick={() => handleAction('copyId')}>Copy Device ID</button>
      <div className='border-t border-gray-200 my-2'></div>
      <button onClick={() => handleAction('copyCoordinates')}>
        Copy Coordinates
      </button>
    </div>
  )
}

export default ContextMenu
