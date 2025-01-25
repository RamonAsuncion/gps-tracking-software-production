import socket
import threading
import json
import mariadb
import secret
from Crypto.Cipher import AES
from datetime import datetime

# Global constants and AES functions
#GLOBAL_PASSWORD = b"Your Mom123"

def pad(s, block_size=16):
    n = block_size - (len(s) % block_size)
    return s + bytes([n] * n)

def unpad(s):
    return s[:-s[-1]]

def decrypt_msg(msg, cipher):
    decrypter = AES.new(cipher, AES.MODE_ECB)
    return unpad(decrypter.decrypt(msg))

# Initialize and connect to the database
def initialize_database():
    try:
        conn = mariadb.connect(
            host=secret.dbhost,
            user=secret.user,
            password=secret.password,
            database=secret.db
        )
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sensor_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                device_id VARCHAR(255),
                longitude DOUBLE,
                latitude DOUBLE,
                elevation DOUBLE,
                timestamp DATETIME
            )
        """)
        conn.commit()
    except mariadb.Error as e:
        print(f"Error connecting to MariaDB: {e}")
    finally:
        if conn:
            conn.close()

import mariadb
from datetime import datetime

def insert_data_into_database(data):
    try:
        conn = mariadb.connect(
            host=secret.dbhost,
            user=secret.user,
            password=secret.password,
            database=secret.db
        )
        cursor = conn.cursor()

        # Convert timestamp string to datetime object
        timestamp_str = data['timestamp']
        hours = int(timestamp_str[0:2])
        minutes = int(timestamp_str[3:5])
        seconds = int(timestamp_str[6:8])
        # Get today's date
        today_date = datetime.now().date()
        # Create a datetime object using today's date and the extracted time components
        timestamp = datetime(today_date.year, today_date.month, today_date.day, hours, minutes, seconds)

        # Format the datetime object according to the database requirements
        timestamp_formatted = timestamp.strftime("%Y-%m-%d %H:%M:%S.%f")

        cursor.execute("""
            INSERT INTO sensor_data (device_id, longitude, latitude, elevation, timestamp)
            VALUES (%s, %s, %s, %s, %s)
        """, (data['device_id'], data['longitude'], data['latitude'], data['elevation'], timestamp_formatted))
        conn.commit()
    except mariadb.Error as e:
        print(f"Error inserting data into MariaDB: {e}")
    finally:
        if conn:
            conn.close()


def handle_client(client_socket, address):
    print(f"Accepted connection from {address}")
    #key = pad(GLOBAL_PASSWORD)  # Prepare the AES key

    while True:
        data = client_socket.recv(1024)
        if not data:
            print(f"Client {address} disconnected")
            break
        try:
            message = data
            print(f"Received message from {address}: {message}")
            json_data = json.loads(message)
            insert_data_into_database(json_data)
        except Exception as e:
            print(f"Error handling message from {address}: {e}")

    client_socket.close()

def start_server(host='0.0.0.0', port=5889):
    initialize_database()  # Ensure the database is ready
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen(100)
    print(f"TCP Server listening on {host}:{port}")

    while True:
        client_socket, address = server_socket.accept()
        client_handler = threading.Thread(target=handle_client, args=(client_socket, address), daemon=True)
        client_handler.start()

if __name__ == "__main__":
    start_server()
