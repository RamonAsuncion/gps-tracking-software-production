"""
This script writes secrets to the device protected by a private key.
"""
import sys
import time
import machine

from cryptolib import aes


# simple PKCS7 unpadding (no error checking!)
def unpad(s):
    # the last byte is the number of padding bytes
    return s[:-s[-1]]

# simple PKCS7 padding
def pad(s, block_size=32):
    # the last byte is the number of padding bytes, repeated
    n = block_size - (len(s) % block_size)
    if n == 0:
        n = block_size
    return s + bytes([n] * n)

k = pad(b'not a great key' + machine.unique_id())

ssid=""
password=""

cipher = aes(k, 1)
ct = cipher.encrypt(pad(ssid.encode('utf-8')))
print(ct)

ct = cipher.encrypt(pad(password.encode('utf-8')))
print(ct)
