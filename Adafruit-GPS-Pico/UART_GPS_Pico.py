from machine import Pin, UART
import utime
uart = UART(0, baudrate=9600, tx=Pin(0), rx=Pin(1))

while True:
    if uart.any():
        data = uart.read()
        print(data)
    utime.sleep(1) 

