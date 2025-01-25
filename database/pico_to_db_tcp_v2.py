import socket
import threading
import json
import mariadb
import secret
from Crypto.Cipher import AES
from datetime import datetime

class AESCryptor:
    def __init__(self, key):
        self.key = self.pad(key)
    
    @staticmethod
    def pad(s, block_size=16):
        n = block_size - (len(s) % block_size)
        return s + bytes([n] * n)

    @staticmethod
    def unpad(s):
        return s[:-s[-1]]

    def decrypt(self, msg):
        decrypter = AES.new(self.key, AES.MODE_ECB)
        return self.unpad(decrypter.decrypt(msg))

class DatabaseManager:
    def __init__(self):
        self.conn = None
        self.connect()

    def connect(self):
        try:
            self.conn = mariadb.connect(
                host=secret.dbhost,
                user=secret.user,
                password=secret.password,
                database=secret.db
            )
            self.initialize_database()
        except mariadb.Error as e:
            print(f"Error connecting to MariaDB: {e}")

    def initialize_database(self):
        cursor = self.conn.cursor()
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
        self.conn.commit()

    def insert_data(self, data):
        cursor = self.conn.cursor()
        timestamp = self.format_timestamp(data['timestamp'])
        cursor.execute("""
            INSERT INTO sensor_data (device_id, longitude, latitude, elevation, timestamp)
            VALUES (%s, %s, %s, %s, %s)
        """, (data['device_id'], data['longitude'], data['latitude'], data['elevation'], timestamp))
        self.conn.commit()
        print(f'Inserted {data} into database successfully!')

    @staticmethod
    def format_timestamp(timestamp_str):
        hours = int(timestamp_str[0:2])
        minutes = int(timestamp_str[3:5])
        seconds = int(timestamp_str[6:8])
        # Get today's date
        today_date = datetime.now().date()
        # Create a datetime object using today's date and the extracted time components
        timestamp = datetime(today_date.year, today_date.month, today_date.day, hours, minutes, seconds)

        # Format the datetime object according to the database requirements
        timestamp_formatted = timestamp.strftime("%Y-%m-%d %H:%M:%S.%f")
        return timestamp_formatted

    def close(self):
        if self.conn:
            self.conn.close()

class Server:
    def __init__(self, host='0.0.0.0', port=5889):
        self.host = host
        self.port = port
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.db_manager = DatabaseManager()

    def handle_client(self, client_socket, address):
        print(f"Accepted connection from {address}")
        while True:
            data = client_socket.recv(1024)
            if not data:
                print(f"Client {address} disconnected")
                break
            try:
                print("Message Recieved: ", data)
                json_data = json.loads(data)
                self.db_manager.insert_data(json_data)
            except Exception as e:
                print(f"Error handling message from {address}: {e}")
        client_socket.close()

    def start(self):
        self.server_socket.bind((self.host, self.port))
        self.server_socket.listen(100)
        print(f"TCP Server listening on {self.host}:{self.port}")
        try:
            while True:
                client_socket, address = self.server_socket.accept()
                client_handler = threading.Thread(target=self.handle_client, args=(client_socket, address), daemon=True)
                client_handler.start()
        finally:
            self.db_manager.close()

if __name__ == "__main__":
    server = Server()
    server.start()
