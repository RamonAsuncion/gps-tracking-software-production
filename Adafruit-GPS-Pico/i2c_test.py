from machine import Pin, I2C
import utime

i2c = I2C(0, sda=Pin(0), scl=Pin(1))
utime.sleep_ms(100)
devices = i2c.scan()
print("I2C devices found:", devices)

while True:
    data = i2c.readfrom(0x10, 32)
    print("Data from GPS:", data)
    utime.sleep(1)