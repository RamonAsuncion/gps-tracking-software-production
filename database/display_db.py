import mariadb
import json
import secret
from tabulate import tabulate
import threading

def initialize_database():
    """
    Initialize the MariaDB database and the sensor_data table if it doesn't exist.
    This function connects to the MariaDB server using credentials stored in a separate 'secret' module,
    ensuring sensitive information is not hardcoded in the script.
    """
    try:
        # Connect to MariaDB
        with mariadb.connect(
            host=secret.dbhost,
            database=secret.db,
            user=secret.user,
            password=secret.password) as conn:
            cursor = conn.cursor()
            # SQL statement to create the table if it does not exist
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS sensor_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                device_id VARCHAR(255) NOT NULL,
                longitude DOUBLE NOT NULL,
                latitude DOUBLE NOT NULL,
                elevation DOUBLE NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
            cursor.execute(create_table_sql)
            conn.close()
    except mariadb.Error as e:
        print(f"Error connecting to MariaDB: {e}")

def insert_data_into_database(data_batch):
    """
    Inserts a batch of sensor data into the MariaDB database.
    This function is designed to run in a separate thread to avoid blocking the MQTT client.
    """
    try:
        # Connect to MariaDB
        with mariadb.connect(
            host=secret.dbhost,
            database=secret.db,
            user=secret.user,
            password=secret.password) as conn:
            cursor = conn.cursor()
            # Insert each data point in the batch into the database
            for data in data_batch:
                cursor.execute("INSERT INTO sensor_data (device_id, longitude, latitude, elevation) VALUES (?, ?, ?, ?)",
                               (data['device_id'], data['longitude'], data['latitude'], data['elevation']))
            conn.close()
    except mariadb.Error as e:
        print(f"Error inserting data into MariaDB: {e}")

def read_json():
    """
    Callback for when a PUBLISH message is received from the MQTT server.
    Launches a thread to handle database insertion of the received data.
    """
    file = "fake_data.txt"
    with open(file) as f:
        threading.Thread(target=insert_data_into_database, args=(json.loads(f.read()), )).start()

def read_db():
    """
    Reads data from the sensor_data table and prints it out.
    """
    try:
        with mariadb.connect(
            host=secret.dbhost,
            database=secret.db,
            user=secret.user,
            password=secret.password) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, device_id, longitude, latitude, elevation, timestamp FROM sensor_data")
            data = cursor.fetchall()
            print(tabulate(data, headers=['ID', 'Device ID', 'Longitude', 'Latitude', 'Elevation', 'Timestamp'], tablefmt='pretty'))
    except mariadb.Error as e:
        print(f"Error reading from MariaDB: {e}")

def change_table():
    try:
        with mariadb.connect(
            host=secret.dbhost,
            database=secret.db,
            user=secret.user,
            password=secret.password) as conn:
            cursor = conn.cursor()
            cursor.execute("ALTER TABLE sensor_data RENAME TO sensor_data_old")
            #data = cursor.fetchall()
            #print(tabulate(data, headers=['ID', 'Accessory ID', 'Longitude', 'Latitude', 'Elevation', 'Timestamp'], tablefmt='pretty'))
    except mariadb.Error as e:
        print(f"Error reading from MariaDB: {e}")


def main():
    """
    Main function to initialize the database, read JSON data, and read from the database.
    """
    #initialize_database() # Initialize the database and table
    #read_json() # Read and insert JSON data into the database
    read_db() # Read from the database and print the data

if __name__ == '__main__':
    main()
