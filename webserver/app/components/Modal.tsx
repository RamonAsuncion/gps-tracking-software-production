import React from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
}

const Modal: React.FC<ModalProps & React.PropsWithChildren<{}>> = ({
  isOpen,
  onClose,
  children,
}) => {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 flex items-center justif-center z-50'>
      <div className='absolute inset-0 bg-black opacity-50 z-40'></div>
      <div className='relative bg-e2d9db rounded-lg p-6 w-full max-w-md mx-auto z-50'>
        <button className='absolute top-0 right-0 p-2 text-black' onClick={onClose}>
          X
        </button>
        {children}
      </div>
    </div>
  )
}

export default Modal
