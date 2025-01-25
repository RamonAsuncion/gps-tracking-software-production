interface ToggleSatelliteViewProps {
  isSatellite: boolean
  setIsSatellite: (value: boolean) => void
}

const ToggleSatelliteView: React.FC<ToggleSatelliteViewProps> = ({
  isSatellite,
  setIsSatellite,
}) => {
  const toggleMode = () => {
    setIsSatellite(!isSatellite)
  }

  return (
    <div className='relative inline-flex items-center bg-transparent border border-gray-300 rounded-md'>
      <button
        onClick={toggleMode}
        className={`px-2 py-0.5 text-md ${
          isSatellite
            ? 'bg-e3e3e3 text-4d4d4d rounded-md'
            : 'bg-transparent text-595959'
        }`}
      >
        Satellite
      </button>
      <button
        onClick={toggleMode}
        className={`px-2 py-0.5 text-md ${
          isSatellite
            ? 'bg-transparent text-595959'
            : 'bg-e3e3e3 text-4d4d4d rounded-md'
        }`}
      >
        Standard
      </button>
    </div>
  )
}

export default ToggleSatelliteView
