from machine import I2C, Pin
import utime

def parse_gngga(sentence):
    """
    Parse the latitude and longitude from a $GNGGA sentence.
    """
    parts = sentence.split(',')
    if len(parts) > 5 and parts[2] and parts[4]:  # Check if lat and lon are present
        latitude = parts[2]
        latitude_direction = parts[3]
        longitude = parts[4]
        longitude_direction = parts[5]

        # Convert to decimal format
        lat_deg = float(latitude[:2])
        lat_min = float(latitude[2:])
        lon_deg = float(longitude[:3])
        lon_min = float(longitude[3:])

        lat_decimal = lat_deg + lat_min / 60.0
        lon_decimal = lon_deg + lon_min / 60.0

        if latitude_direction == 'S':
            lat_decimal = -lat_decimal
        if longitude_direction == 'W':
            lon_decimal = -lon_decimal

        return lat_decimal, lon_decimal
    return None, None

# Initialize I2C
i2c = I2C(0, sda=Pin(0), scl=Pin(1))
utime.sleep_ms(100)
devices = i2c.scan()
print("I2C devices found:", devices)
gps_addr = 0x10  # GPS I2C address

# location
i2c.writeto(gps_addr, b'$PMTK314,0,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1*34\r\n')

buffer = ""  # Buffer to hold incoming data

while True:
    data = i2c.readfrom(gps_addr, 32)
    if data:
        buffer += data.decode('utf-8')  # Append data to buffer
        
        # Check if buffer contains end of NMEA sentence
        while '\r\n' in buffer:
            # Split buffer at first occurrence of newline, process line, and keep remainder
            line, buffer = buffer.split('\r\n', 1)
            
            # Process the line if it's a GNGGA sentence
            if line.startswith('$GNGGA'):
                lat, lon = parse_gngga(line)
                if lat is not None and lon is not None:
                    print("Latitude:", lat, "Longitude:", lon)

    utime.sleep_ms(1000)
