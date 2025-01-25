import asyncio
from machine import Pin, I2C, unique_id
#import secrets
from cryptolib import aes
from datetime import datetime
import network
import time
import socket
#import json


class Config:
    SERVER_HOST = ''           # Specify the TCP server IP
    SERVER_PORT = 0            # Specify the TCP server port
    TELEMETRY_INTERVAL_MS = 60000
    WIFI_CONNECT_TIMEOUT_MS = 5000
    GLOBAL_PASSWORD = b"Your Mom123"
    TIMEZONE_OFFSET = -5 * 3600
    MACHINE_ID = 1
    GPS_ADDR = 0x10

class EncryptionManager:
    @staticmethod
    def pad(s, block_size=32):
        n = block_size - (len(s) % block_size)
        return s + bytes([n] * n)

    @staticmethod
    def unpad(s):
        return s[:-s[-1]]

    @staticmethod
    def encrypt_msg(msg, cipher):
        encrypter = aes(EncryptionManager.pad(cipher), 1)
        return encrypter.encrypt(EncryptionManager.pad(msg))

class WiFiManager:
    def __init__(self, ssid, password):
        self.ssid = ssid
        self.password = password
        self.wlan = network.WLAN(network.STA_IF)
        self.wlan.active(True)
        self.led = Pin("LED", Pin.OUT)

    async def connect(self):
        if not self.wlan.isconnected():
            print('Connecting to WiFi...')
            self.wlan.connect(self.ssid, self.password)
            
            start_time = time.ticks_ms()
            while not self.wlan.isconnected() and time.ticks_diff(time.ticks_ms(), start_time) < Config.WIFI_CONNECT_TIMEOUT_MS:
                self.led.value(1)
                await asyncio.sleep_ms(50)
            self.led.value(0)
            if self.wlan.isconnected():
                print(f'WiFi connected: {self.ssid} : {self.wlan.ifconfig()}')
            else:
                print('WiFi connection failed')

class GPSManager:
    def __init__(self, i2c):
        self.i2c = i2c
        self.lat = None
        self.lon = None
        self.datetime_utc = None
        self.elevation = 132.6
        self.gps_updated = False

    async def get_gps_data(self):
        print("Getting GPS data...")
        buffer = ""
        while True:
            try:
                data = self.i2c.readfrom(Config.GPS_ADDR, 32)
                if data:
                    buffer += data.decode('utf-8')
                    while '\r\n' in buffer:
                        line, buffer = buffer.split('\r\n', 1)
                        if line.startswith('$GNGGA'):
                            self.parse_gngga(line)
            except Exception as e:
                print("GPS read error:", e)
            await asyncio.sleep(1)

    def parse_gngga(self, sentence):
        parts = sentence.split(',')
        if len(parts) > 5 and all(parts[idx].strip() for idx in [1, 2, 3, 4, 5]):
            self.datetime_utc = f"{parts[1][:2]}:{parts[1][2:4]}:{parts[1][4:]}"
            lat_deg = float(parts[2][:2])
            lat_min = float(parts[2][2:])
            self.lat = (lat_deg + (lat_min / 60.0)) * (-1 if parts[3] == 'S' else 1)
            lon_deg = float(parts[4][:3])
            lon_min = float(parts[4][3:])
            self.lon = (lon_deg + (lon_min / 60.0)) * (-1 if parts[5] == 'W' else 1)
            self.gps_updated = True
            print("Lat:", self.lat)
            print("Lon:", self.lon)

class TCPConnection:
    def __init__(self):
        self.host = Config.SERVER_HOST
        self.port = Config.SERVER_PORT
        self.socket = None

    async def connect(self):
        """Establishes a TCP connection and handles reconnection on failures."""
        while True:
            try:
                self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                addr_info = socket.getaddrinfo(self.host, self.port)[0][-1]
                print(addr_info)
                self.socket.connect(addr_info)
                print("TCP connection established with:", addr_info)
                break
            except Exception as e:
                print("Failed to connect to TCP server:", e)
                await asyncio.sleep(5)  # Retry after 5 seconds

    async def send_telemetry(self, gps_manager):
        """Sends encrypted GPS data to the server at regular intervals."""
        while True:
            await asyncio.sleep(1)
            # Prepare the message with current GPS data
            message = '{{"device_id": "{}", "longitude": "{}", "latitude": "{}", "elevation": "{}", "timestamp": "{}"}}'.format(
                Config.MACHINE_ID, gps_manager.lon, gps_manager.lat, gps_manager.elevation, gps_manager.datetime_utc).encode("utf-8")
            if gps_manager.lon == None:
                continue
            #encrypted_message = EncryptionManager.encrypt_msg(message.encode('utf-8'), Config.GLOBAL_PASSWORD)
            try:
                self.socket.send(message)
                print("Telemetry sent:", message)
                await asyncio.sleep(30)  # Wait 30 second before sending the next telemetry
            except Exception as e:
                print("Error sending telemetry:", e)
                await self.connect()  # Attempt to reconnect if sending fails


async def main():
    ssid = ""
    password = ""
    wifi_manager = WiFiManager(ssid, password)
    await wifi_manager.connect()

    i2c = I2C(0, sda=Pin(0), scl=Pin(1))
    gps_manager = GPSManager(i2c)
    tcp_connection = TCPConnection()
    await tcp_connection.connect()

    # Start the GPS data retrieval task in the background
    gps_task = asyncio.create_task(gps_manager.get_gps_data())

    print("Started GPS data retrieval task.")

    telemetry_task = asyncio.create_task(tcp_connection.send_telemetry(gps_manager))
    print("Started telemetry task.")

    await asyncio.gather(gps_task, telemetry_task)  # Wait for both tasks to finish


if __name__ == "__main__":
    asyncio.run(main())