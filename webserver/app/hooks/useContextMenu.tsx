import { useState, useEffect } from 'react'

const useContextMenu = () => {
  const [visible, setVisible] = useState(false)
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [action, setAction] = useState(null)

  const show = (e: React.MouseEvent, action: any) => {
    e.preventDefault()
    setX(e.pageX)
    setY(e.pageY)
    setAction(action)
    setVisible(true)
  }

  const hide = () => setVisible(false)

  useEffect(() => {
    window.addEventListener('click', hide)
    return () => window.removeEventListener('click', hide)
  }, [visible])

  return { visible, x, y, action, show, hide }
}

export default useContextMenu
