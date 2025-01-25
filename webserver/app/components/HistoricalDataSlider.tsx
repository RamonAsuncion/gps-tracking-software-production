import React, { useState } from 'react'
import { LuClock9 } from 'react-icons/lu'

interface HistoricalDataSliderProps {
  onSliderVisibilityChange: () => void
  onSliderChange: (days: number) => void
  onButtonClick: () => void
}

const HistoricalDataSlider: React.FC<HistoricalDataSliderProps> = ({
  onSliderVisibilityChange,
  onSliderChange,
  onButtonClick,
}) => {
  const [isSliderVisible, setIsSliderVisible] = useState(false)
  const [isButtonClicked, setIsButtonClicked] = useState(false)
  const [selectedDays, setSelectedDays] = useState(0)

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const days = Number(event.target.value)
    setSelectedDays(days)
    onSliderChange(days)
  }

  const toggleSliderVisibility = () => {
    setIsSliderVisible(!isSliderVisible)
    if (!isSliderVisible) {
      setSelectedDays(0)
      onSliderChange(0)
    }
  }

  const handleButtonClick = () => {
    onButtonClick()
    setIsButtonClicked(!isButtonClicked)
    onSliderVisibilityChange()
    toggleSliderVisibility()
  }

  return (
    <div className='flex gap-2'>
      {isSliderVisible && (
        <div className='flex items-center'>
          <input
            type='range'
            min='0'
            max='5'
            value={selectedDays}
            onChange={handleSliderChange}
            className='slider w-24 mr-2 appearance-none bg-gray-200 h-1 rounded-md focus:outline-none focus:bg-blue-400 hover:bg-blue-300'
            id='myRange'
          />
          <div className='text-custom-text'>{selectedDays} days</div>
        </div>
      )}
      <LuClock9
        size={24}
        className='mr-2 text-custom-text flex-grow-0 clock-icon'
        onClick={handleButtonClick}
      />
    </div>
  )
}

export default HistoricalDataSlider
