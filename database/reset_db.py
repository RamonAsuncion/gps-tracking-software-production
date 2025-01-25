import mariadb
import secret  # Make sure to have a secret.py file with the DB credentials

def connect_to_database():
    """Connect to the MariaDB database and return the connection."""
    try:
        conn = mariadb.connect(
            host=secret.dbhost,
            database=secret.db,
            user=secret.user,
            password=secret.password
        )
        return conn
    except mariadb.Error as e:
        print(f"Error connecting to MariaDB: {e}")
        return None

def delete_all_entries(conn, table_name):
    """
    Deletes all entries from the specified table in the MariaDB database.

    :param conn: Database connection.
    :param table_name: Name of the table to clear.
    """
    try:
        cursor = conn.cursor()
        delete_query = f"DELETE FROM {table_name};"
        cursor.execute(delete_query)
        conn.commit()
        reset_counter = "ALTER TABLE sensor_data AUTO_INCREMENT = 1;"
        cursor.execute(reset_counter)
        conn.commit()
        print(f"All entries from '{table_name}' have been deleted.")
    except mariadb.Error as e:
        print(f"Error deleting entries from MariaDB: {e}")

def main():
    conn = connect_to_database()
    if conn is not None:
        table_name = "sensor_data"  # Replace with your table name
        delete_all_entries(conn, table_name)
        conn.close()

if __name__ == '__main__':
    main()
