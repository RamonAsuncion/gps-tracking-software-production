import React, { useEffect, useState, useRef, useMemo } from 'react'
import { ChromePicker } from 'react-color'
import useContextMenu from '../hooks/useContextMenu'
import ContextMenu from '../components/ContextMenu'
import AccessoryIcon from '../components/AccessoryIcon'
import Popup from 'reactjs-popup'
import 'reactjs-popup/dist/index.css'
import useLocalStorage from '../hooks/useLocalStorage'
import { iconMap, UIMap, getIconSvgString } from '../utils/iconMap'
import Modal from '../components/Modal'
import formatcoords from 'formatcoords'

interface Accessory {
  id: string
  name: string
  location: string
  icon: string
  color: string
  status: 'offline' | 'pending' | 'online'
}

interface Location {
  lat: number
  lng: number
}

interface LocationAndStatus {
  id: string
  location: Location | null
  status: string
  timestamp: string
}

interface AccessoryColorAndIcon {
  id: string
  color: string
  icon: string
}

interface AccessoriesProps {
  onSelectAccessory: (id: string | null) => void
  onUpdateAccessoryColorAndIcon: (
    colorAndIcons: AccessoryColorAndIcon[],
  ) => void
  isSliderActive: boolean
  isButtonClicked: boolean
  inputValue: string
  setInputValue: (value: string) => void
  locationAndStatus: LocationAndStatus[] | null
  onNotification: (message: string) => void
}

interface Color {
  hex: string
}

const Accessories: React.FC<AccessoriesProps> = ({
  onSelectAccessory,
  onUpdateAccessoryColorAndIcon,
  isSliderActive,
  isButtonClicked,
  inputValue,
  setInputValue,
  locationAndStatus,
  onNotification,
}) => {
  const [accessories, setAccessories] = useLocalStorage<Accessory[]>(
    'accessories',
    [],
  )
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [activeColorPicker, setActiveColorPicker] = useState<number | null>(
    null,
  )
  const [selectedAccessory, setSelectedAccessory] = useState<string | null>(
    null,
  )
  const [isPopupOpen, setIsPopupOpen] = React.useState<{
    [key: string]: boolean
  }>({})
  const ref = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const { visible, x, y, show, hide } = useContextMenu()
  const accessoryIconRef = React.useRef<HTMLDivElement>(null)
  const colors = ['red', 'grey', 'blue', 'orange', 'yellow']
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inputAccessoryId, setInputAccessoryId] = useState('')
  const [accessoryExists, setAccessoryExists] = useState(false)
  const [editingAccessoryId, setEditingAccessoryId] = useState<string | null>(
    null,
  )
  const [isAccessoryDisplayed, setIsAccessoryDisplayed] = useState(false)
  const [submissionError, setSubmissionError] = useState(false)
  const [notFoundError, setNotFoundError] = useState(false)
  const prevInputValueRef = useRef(inputValue)
  const [accessoryColorAndIcon, setAccessoryColorAndIcon] = useState<
    AccessoryColorAndIcon[]
  >([])
  const memoizedLocationAndStatus = useMemo(
    () => locationAndStatus,
    [locationAndStatus],
  )

  /**
   * Converts a given timestamp into a formatted time string.
   * Extracts the hours and minutes from the timestamp and formats them as HH:MM.
   *
   * @param {string} timestamp - The timestamp to be converted, in the format of 'YYYY-MM-DD HH:MM:SS'.
   * @returns {string} - The formatted time string in the format of 'HH:MM'.
   */
  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp)
    const hours = date.getHours()
    const minutes = date.getMinutes()

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`
  }

  /**
   * Update the accessory with it's location data.
   */
  useEffect(() => {
    const updatedAccessories = [...accessories]
    let hasChanged = false
    if (locationAndStatus === null) {
      updatedAccessories.forEach(accessory => {
        if (accessory.location !== 'No location found') {
          accessory.location = 'No location found'
          hasChanged = true
        }
      })
      return
    } else {
      locationAndStatus.forEach(item => {
        const index = updatedAccessories.findIndex(acc => acc.id === item.id)

        if (index !== -1) {
          const formattedLocation = item.location
            ? `${formatcoords(item.location.lat, item.location.lng).format(
                'DD MM ss X',
                {
                  latLonSeparator: ', ',
                  decimalPlaces: 1,
                },
              )}, ${formatTimestamp(item.timestamp)}`
            : 'No location found'

          if (
            updatedAccessories[index].location !== formattedLocation ||
            updatedAccessories[index].status !== item.status
          ) {
            updatedAccessories[index] = {
              ...updatedAccessories[index],
              location: formattedLocation,
              status: item.status as 'offline' | 'pending' | 'online',
            }
            hasChanged = true
          }
        }
      })
    }

    if (hasChanged) {
      setAccessories(updatedAccessories)
    }
  }, [memoizedLocationAndStatus])

  /**
   * Get the icon and the color of the accessory.
   *
   * @param id - The ID of the accessory.
   *
   * Reference: https://www.dhiwise.com/post/react-append-to-state-array-understanding-immutability
   */
  const updateAccessoryColorAndIcon = (id: string) => {
    const accessory = accessories.find(acc => acc.id === id)

    if (accessory) {
      setAccessoryColorAndIcon(prevAccessoryColorAndIcon => {
        const index = prevAccessoryColorAndIcon.findIndex(acc => acc.id === id)
        let updatedAccessories = [...prevAccessoryColorAndIcon]

        if (index !== -1) {
          updatedAccessories[index] = {
            id: accessory.id,
            color: accessory.color,
            icon: getIconSvgString(accessory.icon),
          }
        } else {
          updatedAccessories = [
            ...updatedAccessories,
            {
              id: accessory.id,
              color: accessory.color,
              icon: getIconSvgString(accessory.icon),
            },
          ]
        }

        onUpdateAccessoryColorAndIcon(updatedAccessories)
        return updatedAccessories
      })
    }
  }

  /**
   * Updates accessory color and icon for each accessory in the list.
   * Triggered on accessories array change.
   */
  useEffect(() => {
    accessories.forEach(accessory => {
      updateAccessoryColorAndIcon(accessory.id)
    })
  }, [accessories])

  /**
   * Open the modal.
   *
   * @returns
   */
  const openModal = () => setIsModalOpen(true)

  /**
   * Close the modal.
   *
   * @returns
   */
  const closeModal = () => setIsModalOpen(false)

  useEffect(() => {
    /**
     * Remove the highlight from accessory once the user clicks anywhere.
     *
     * @param {MouseEvent} event The mouse event of the click.
     * @returns
     */
    const handleClickOutside = (event: MouseEvent) => {
      // Ignore if the click is within the context menu
      if (
        visible &&
        contextMenuRef.current &&
        contextMenuRef.current.contains(event.target as Node)
      )
        return

      // Ignore if the click is within the history menu or if the button is clicked
      if (
        isButtonClicked ||
        (isButtonClicked && isSliderActive) ||
        (event.target as HTMLElement).closest('.clock-icon')
      )
        return

      // Remove the highlight if the click is outside the accessories container
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setSelectedAccessory(null)
        onSelectAccessory(null)
        setInputValue('Your accessories')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible, contextMenuRef, ref, isSliderActive, isButtonClicked])

  /**
   * The user selects the accessory it should get the associated index.
   *
   * @param {string} id - The id of the selected accessory.
   * @param {string} name - The name of the selected accessory.
   */
  const handleAccessoryClick = (id: string, name: string) => {
    setSelectedAccessory(id)
    onSelectAccessory(id)
    setInputValue(name)
  }

  /**
   * Check if the accessory exists in the database.
   *
   * @param deviceID - The ID of the device.
   */
  const checkAccessoryExistence = async (deviceID: string) => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000'
      const endpoint = '/api/check_device_existence'

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ device_id: deviceID }),
      })
      const data = await response.json()

      if (data.exists) {
        setAccessoryExists(data.exists)
        setSubmissionError(false)
      } else {
        setAccessoryExists(data.exists)
        setNotFoundError(true)
      }
    } catch (error) {
      console.error('Error checking accessory existence:', error)
      setSubmissionError(true)
    }
  }

  /**
   * Create a new accessory with default information
   * if the accessory exists in the database.
   */
  const addNewAccessory = async () => {
    try {
      if (inputAccessoryId.trim() === '') {
        setNotFoundError(true)
        return
      }

      if (inputValue !== prevInputValueRef.current) {
        setIsAccessoryDisplayed(false)
      }

      setIsAccessoryDisplayed(false)

      const isAccessoryDisplayed = accessories.some(
        accessory => accessory.id === inputAccessoryId,
      )

      if (isAccessoryDisplayed) {
        setIsAccessoryDisplayed(true)
        return
      }

      //
      await checkAccessoryExistence(inputAccessoryId)
    } catch (error) {
      console.error('Error adding new accessory:', error)
    }
  }

  /**
   * Extension to the addNewAccessory function to make
   * sure accessory is added and not delayed by waiting.
   */
  useEffect(() => {
    if (accessoryExists) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      const newAccessory: Accessory = {
        id: inputAccessoryId,
        name: 'New Accessory',
        location: 'No location found',
        icon: 'pin',
        color: randomColor,
        status: 'offline',
      }

      addAccessory(newAccessory)
      updateAccessoryColorAndIcon(newAccessory.id)
      setAccessoryExists(false)
    }
  }, [accessoryExists])

  /**
   * Add accessory to array.
   */
  const addAccessory = (newAccessory: Accessory) => {
    setAccessories(prevAccessories => [...prevAccessories, newAccessory])
  }

  /**
   * Determine the status of the accessory.
   *
   * @returns {string} - The status of the accessory component.
   */
  const getStatus = (): string => {
    if (isAccessoryDisplayed) {
      return 'Already Displayed'
    } else if (accessoryExists) {
      return 'Added'
    } else if (submissionError) {
      return 'Offline'
    } else if (notFoundError) {
      return 'Not Found'
    } else {
      return 'New'
    }
  }

  /**
   * Reset states used for error messages.
   */
  function resetMessage() {
    setIsAccessoryDisplayed(false)
    setSubmissionError(false)
    setNotFoundError(false)
    setAccessoryExists(false)
  }

  /**
   * Reset the status after modal closes.
   */
  useEffect(() => {
    if (!isModalOpen) {
      resetMessage()
    }
  }, [isModalOpen])

  /**
   * Renames an accessory.
   *
   * @param {string} id - The ID of the accessory to rename.
   */
  const handleRename = (id: string) => {
    setEditingAccessoryId(id)
  }

  /**
   * Deletes an accessory.
   *
   * @param {string} id - The ID of the accessory to delete.
   */
  const handleDelete = (id: string) => {
    const updatedAccessories = accessories.filter(
      accessory => accessory.id !== id,
    )
    setAccessories(updatedAccessories)

    setAccessoryColorAndIcon(prevAccessoryColorAndIcon =>
      prevAccessoryColorAndIcon.filter(acc => acc.id !== id),
    )

    if (updatedAccessories.length === 0) {
      setAccessories([])
      setAccessoryColorAndIcon([])
      accessoryColorAndIcon.length = 0
    }
  }

  /**
   * Copies the ID of an accessory to the clipboard.
   *
   * @param {string} id - The ID of the accessory to copy.
   */
  const handleCopyId = (id: string) => {
    navigator.clipboard
      .writeText(id)
      .then(() => {
        onNotification('Accessory ID copied to clipboard!')
      })
      .catch(err => {
        console.error('Failed to copy text: ', err)
      })
  }

  /**
   * Change the icon of the accessory.
   *
   * @param {string} id - The ID of the accessory to copy.
   * @param {number} index - The current selected accessory.
   * @param {string} icon - The name of the user selected icon.
   */
  const selectIcon = (id: string, index: number, icon: string) => {
    const updatedAccessories = accessories.map(
      (accessory: Accessory, i: number) => {
        if (i === index) {
          return { ...accessory, icon }
        }
        return accessory
      },
    )
    setAccessories(updatedAccessories)
    updateAccessoryColorAndIcon(id)
  }

  /**
   * Change the color of the accessory.
   *
   * @param {string} id - The ID of the accessory to copy.
   * @param {number} index - The selected accessory.
   * @param {Color} color - The user selected color.
   */
  const handleColorChange = (id: string, index: number, color: Color) => {
    const updatedAccessories = accessories.map(
      (accessory: Accessory, i: number) => {
        if (i === index) {
          return { ...accessory, color: color.hex }
        }
        return accessory
      },
    )
    setAccessories(updatedAccessories)
    updateAccessoryColorAndIcon(id)
  }

  /**
   * Copy the coordinates (longitude and latitude) to clipboard.
   *
   * @param {string} id - The ID of the accessory to copy.
   */
  const handleCopyCoordinates = (id: string) => {
    const accessory = locationAndStatus?.find(item => item.id === id)

    if (accessory && accessory.location) {
      const { lat, lng } = accessory.location

      const coordinatesString = `Latitude: ${lat.toFixed(
        2,
      )}, Longitude: ${lng.toFixed(2)}`

      navigator.clipboard
        .writeText(coordinatesString)
        .then(() => {
          onNotification('Coordinates copied to clipboard!')
        })
        .catch(err => {
          console.error('Failed to copy coordinates: ', err)
          onNotification('Failed to copy coordinates.')
        })
    } else {
      onNotification('Accessory not found.')
    }
  }

  /**
   * The color choosing menu.
   *
   * @param {number} index - The selected accessory.
   */
  const toggleColorPicker = (index: number) => {
    setShowColorPicker(!showColorPicker)
    setActiveColorPicker(index)
  }

  /**
   * Handles the context menu event on an accessory.
   *
   * @param {React.MouseEvent} e - The mouse event object.
   * @param {string} id - The ID of the accessory that was right-clicked.
   */
  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    setSelectedAccessory(id)
    show(e, 'accessory')
  }

  /**
   * Handles changes in the input field for renaming an accessory.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event object.
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
  }

  /**
   * Add an event listener to the window object to listen for a specific
   * key press.
   *
   * @param {string} key - The key pressed.
   * @param {any} action - The action function that's being called.
   */
  function useKeypress(key: string, action: any): void {
    useEffect(() => {
      const onKeyPress = (event: KeyboardEvent) => {
        if (event.key === key) {
          action()
        }
      }

      window.addEventListener('keydown', onKeyPress)

      return () => {
        window.removeEventListener('keydown', onKeyPress)
      }
    }, [key, action])
  }

  /** Add a new accessory on enter. */
  useKeypress('Enter', addNewAccessory)

  /** Close the modal on escape. */
  useKeypress('Escape', closeModal)

  return (
    <div className='flex flex-col' ref={ref}>
      {/* Add accessory button */}
      <button className='p-1 rounded-full text-custom-text' onClick={openModal}>
        {UIMap.addAccessory}
      </button>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <h2 className='text-lg text-black font-bold mb-4'>Add Device ID</h2>
        <input
          className={`w-full p-2 border focus:outline-none rounded mb-4 text-black ${
            notFoundError
              ? 'border-red-500 focus:border-red-500'
              : accessoryExists
              ? 'border-green-500 focus:border-green-500'
              : submissionError
              ? 'border-red-500 focus:border-red-500'
              : isAccessoryDisplayed
              ? 'border-yellow-500 focus:border-yellow-500'
              : 'border-gray-300 focus:border-gray-500'
          }`}
          type='text'
          placeholder='Enter Device ID'
          value={inputAccessoryId}
          onChange={e => setInputAccessoryId(e.target.value)}
        />
        <div className='flex justify-between items-center mb-3'>
          <p className='text-sm text-gray-500'>Status: {getStatus()}</p>
          <button
            className='bg-blue-500 hover:bg-blue-700 cursor-pointer text-white font-bold py-1 px-2 rounded'
            onClick={addNewAccessory}
          >
            Submit
          </button>
        </div>
      </Modal>
      <span className='text-custom-text text-xl font-medium self-center mb-4'>
        Your accessories
      </span>
      {accessories.map((accessory: Accessory, index: number) => (
        <div
          key={accessory.id}
          className={`flex items-center px-2 mt-2 ml-0 mb-3 w-full p-8 h-14 ${
            selectedAccessory === accessory.id
              ? 'bg-blue-200 border-blue-200 border-3'
              : ''
          }`}
          onClick={() => handleAccessoryClick(accessory.id, accessory.name)}
          onContextMenu={e => handleContextMenu(e, accessory.id)}
        >
          <Popup
            open={isPopupOpen[accessory.id] || false}
            onOpen={() =>
              setIsPopupOpen({
                ...isPopupOpen,
                [accessory.id]: true,
              })
            }
            onClose={() =>
              setIsPopupOpen({
                ...isPopupOpen,
                [accessory.id]: false,
              })
            }
            trigger={
              <AccessoryIcon
                ref={accessoryIconRef}
                icon={accessory.icon}
                color={accessory.color}
                onClick={() => {
                  setIsPopupOpen({
                    ...isPopupOpen,
                    [accessory.id]: true,
                  })
                }}
              />
            }
            position='bottom left'
            closeOnDocumentClick
          >
            <div className='flex items-center justify-center w-full mb-4'>
              <span style={{ fontSize: '12px' }}>Pick a color</span>
              <div
                style={{
                  backgroundColor: accessory.color,
                  width: '20px',
                  height: '20px',
                  marginLeft: '5px',
                  cursor: 'pointer',
                }}
                onClick={() => toggleColorPicker(index)}
              ></div>
            </div>
            {showColorPicker && activeColorPicker === index && (
              <ChromePicker
                color={accessory.color}
                onChangeComplete={color =>
                  handleColorChange(accessory.id, index, color)
                }
              />
            )}
            <div className='grid grid-cols-3 gap-2 p-2 ml-5'>
              {Object.keys(iconMap).map(iconKey => (
                <div
                  key={iconKey}
                  onClick={() => selectIcon(accessory.id, index, iconKey)}
                  className='cursor-pointer'
                >
                  {iconMap[iconKey]}
                </div>
              ))}
            </div>
          </Popup>
          {visible && selectedAccessory && (
            <div ref={contextMenuRef}>
              <ContextMenu
                x={x}
                y={y}
                hide={hide}
                selectedAccessory={selectedAccessory}
                onRename={handleRename}
                onDelete={handleDelete}
                onCopyId={handleCopyId}
                onCopyCoordinates={handleCopyCoordinates}
              />
            </div>
          )}
          <div className='flex justify-between w-full'>
            <div className='ml-2'>
              <p className='text-custom-text font-bold'>
                {editingAccessoryId === accessory.id ? (
                  <input
                    className='bg-custom-bg rounded-md'
                    type='text'
                    defaultValue={accessory.name}
                    onChange={handleInputChange}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                      let inputValue = e.target.value.trim()
                      if (inputValue === '') {
                        inputValue = 'New Accessory'
                      }
                      handleRename(accessory.id)
                      const updatedAccessories = accessories.map(acc =>
                        acc.id === accessory.id
                          ? {
                              ...acc,
                              name: inputValue,
                            }
                          : acc,
                      )
                      setAccessories(updatedAccessories)
                      setEditingAccessoryId(null)
                      setNotFoundError(false)
                    }}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') {
                        if (inputValue === '') {
                          inputValue = 'New Accessory'
                        }
                        handleRename(accessory.id)
                        const updatedAccessories = accessories.map(acc =>
                          acc.id === accessory.id
                            ? {
                                ...acc,
                                name: inputValue,
                              }
                            : acc,
                        )
                        setAccessories(updatedAccessories)
                        setEditingAccessoryId(null)
                      } else if (e.key == 'Escape') {
                        setInputValue(accessory.name)
                        setEditingAccessoryId(null)
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  accessory.name
                )}
              </p>
              <p className='text-sm text-gray-500'>{accessory.location}</p>
            </div>
            <div className='flex items-center space-x-1 mr-3'>
              <div
                className={`w-2 h-2 rounded-full ml-2 ${
                  accessory.status === 'offline'
                    ? 'bg-red-500'
                    : accessory.status === 'pending'
                    ? 'bg-pending'
                    : 'bg-green-500'
                }`}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Accessories
