'use strict'
'use client'

import React, { useState, useEffect, useRef } from 'react'
import Map from './components/Map'
import { IoRefresh } from 'react-icons/io5'
import ToggleSatelliteView from './components/ToggleSatelliteView'
import HistoricalDataSlider from './components/HistoricalDataSlider'
import Accessories from './components/Accessory'
import io, { Socket } from 'socket.io-client'

interface AccessoryMetaData {
  id: string
  color: string
  icon: string
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

const Page = () => {
  const [selectedDays, setSelectedDays] = useState(0)
  const [isSliderActive, setIsSliderActive] = useState(false)
  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string | null>(
    null,
  )
  const [isSliderVisible, setIsSliderVisible] = useState(false)
  const [isButtonClicked, setIsButtonClicked] = useState(false)
  const [isSatellite, setIsSatellite] = useState(false)
  const [accessoryStatus, setAccessoryStatus] = useState('offline')
  const [accessoryColorAndIcon, setAccessoryColorAndIcon] = useState<
    AccessoryMetaData[]
  >([])
  const [inputValue, setInputValue] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const [locationAndStatus, setLocationAndStatus] = useState<
    LocationAndStatus[] | null
  >([])
  const [copyNotification, setCopyNotification] = useState<string>('')

  /**
   * Refresh the data.
   */
  const handleRefresh = async () => {
    try {
      if (selectedAccessoryId) {
        socketRef.current?.emit('get_latest_data', {
          device_id: selectedAccessoryId,
        })
      } else {
        socketRef.current?.emit('get_latest_data', { all: true })
      }
    } catch (error) {
      console.log('Failed to refresh data:', error)
    }
  }

  /**
   * Handle notifications from copying.
   *
   * @param {string} message - The custom message for the notification.
   */
  const handleNotification = (message: string) => {
    setCopyNotification(message)
    setTimeout(() => setCopyNotification(''), 2000)
  }

  /**
   * Check the server status.
   */
  useEffect(() => {
    const flaskApiUrl =
      process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000'

    socketRef.current = io(flaskApiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    })

    socketRef.current.on('connect', () => {
      setAccessoryStatus('online')
    })

    socketRef.current.on('disconnect', () => {
      setAccessoryStatus('offline')
    })

    socketRef.current.on('connect_error', () => {
      setAccessoryStatus('offline')
    })

    socketRef.current.on('connect_timeout', () => {
      setAccessoryStatus('offline')
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  /**
   * Change the number of days to display on the map.
   *
   * @param days The number of days to display.
   */
  const handleSliderChange = (days: number) => {
    setSelectedDays(days)
  }

  /**
   * Change the visibility of the slider.
   */
  const handleSliderVisibilityChange = () => {
    setIsSliderVisible(!isSliderVisible)
    setIsSliderActive(!isSliderActive)
  }

  /**
   * Handle the button click event.
   */
  const handleButtonClick = () => {
    setIsButtonClicked(!isButtonClicked)
  }

  return (
    <div className='flex'>
      {/* Left Side Menu */}
      <div className='w-1/4 h-screen bg-custom-bg border-r-2 border-custom-border'>
        <Accessories
          onSelectAccessory={setSelectedAccessoryId}
          onUpdateAccessoryColorAndIcon={setAccessoryColorAndIcon}
          isSliderActive={isSliderActive}
          isButtonClicked={isButtonClicked}
          inputValue={inputValue}
          setInputValue={setInputValue}
          locationAndStatus={locationAndStatus}
          onNotification={handleNotification}
        />
      </div>
      {/* Header */}
      <div className='flex-grow relative'>
        <div className='bg-white p-4'>
          <div className='flex justify-between items-center'>
            <h1 className='text-xl font-bold text-custom-text flex-grow'>
              {inputValue || 'Your accessories'}
            </h1>
            <HistoricalDataSlider
              onSliderVisibilityChange={handleSliderVisibilityChange}
              onSliderChange={handleSliderChange}
              onButtonClick={handleButtonClick}
            />
            <ToggleSatelliteView
              isSatellite={isSatellite}
              setIsSatellite={setIsSatellite}
            />
            <button
              className='px-4 flex items-center text-custom-text ml-auto'
              onClick={handleRefresh}
            >
              <IoRefresh size={24} />
              <div
                className={`w-2 h-2 rounded-full ml-2 ${
                  accessoryStatus === 'offline' ? 'bg-red-500' : 'bg-green-500'
                }`}
              ></div>
            </button>
          </div>
        </div>
        {/* UI Buttons for Map*/}
        <div className='flex items-center justify-center'>
          <Map
            socket={socketRef.current}
            accessoryColorAndIcon={accessoryColorAndIcon}
            selectedAccessoryId={selectedAccessoryId}
            selectedDays={selectedDays}
            isButtonClicked={isButtonClicked}
            isSatellite={isSatellite}
            setLocationAndStatus={setLocationAndStatus}
          />
        </div>
      </div>
      {copyNotification && (
        <div className='fixed inset-0 flex items-center justify-center pointer-events-none'>
          <div className='bg-black bg-opacity-50 text-white p-4 rounded-lg'>
            {copyNotification}
          </div>
        </div>
      )}
    </div>
  )
}

export default Page
