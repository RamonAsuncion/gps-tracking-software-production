import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { FiPlus, FiMinus } from 'react-icons/fi'
import { MdLuggage } from 'react-icons/md'
import { FaCar } from 'react-icons/fa'
import { MdBackpack } from 'react-icons/md'
import { IoKeySharp } from 'react-icons/io5'
import { IoPin } from 'react-icons/io5'
import { FaWallet } from 'react-icons/fa'
import { PiSuitcaseBold } from 'react-icons/pi'
import { FaBicycle } from 'react-icons/fa'
import { BsPersonWalking } from 'react-icons/bs'
import { MdOutlineLaptopChromebook } from 'react-icons/md'
import { FaGuitar } from 'react-icons/fa6'
import { FaCameraRetro } from 'react-icons/fa'

/**
 * A map of icon components keyed by their names.
 */
export const iconMap: { [key: string]: JSX.Element } = {
  pin: <IoPin size={20} />,
  luggage: <MdLuggage size={20} />,
  car: <FaCar size={20} />,
  backpack: <MdBackpack size={20} />,
  key: <IoKeySharp size={20} />,
  wallet: <FaWallet size={20} />,
  suitcase: <PiSuitcaseBold size={20} />,
  bicycle: <FaBicycle size={20} />,
  personWalking: <BsPersonWalking size={20} />,
  laptop: <MdOutlineLaptopChromebook size={20} />,
  guitar: <FaGuitar size={20} />,
  camera: <FaCameraRetro size={20} />,
}

/**
 * A map of UI icon components keyed by their names.
 */
export const UIMap: { [key: string]: JSX.Element } = {
  addAccessory: <FiPlus size={25} />,
  zoomIn: <FiPlus size={20} />,
  zoomOut: <FiMinus size={20} />,
}

/**
 * Renders the specified icon as an SVG string.
 * Reference: https://stackoverflow.com/questions/68103849/get-svg-from-react-icons-components
 *
 * @param {string} iconKey - The key of the icon to render as an SVG string.
 * @returns {string} The SVG string representation of the icon.
 * @throws {Error} If the icon key is not found in `iconMap`.
 */
export function getIconSvgString(iconKey: string): string {
  const iconComponent = iconMap[iconKey]
  if (!iconComponent) {
    throw new Error(`Icon with key "${iconKey}" not found.`)
  }
  return ReactDOMServer.renderToString(iconComponent)
}
