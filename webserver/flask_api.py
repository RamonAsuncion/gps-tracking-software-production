"""
Flask REST API with WebSockets
"""
from flask import Flask, jsonify, request
from flask_restful import Api
from flask_socketio import SocketIO, emit
import mariadb
import secret
from datetime import datetime, timedelta, timezone
from flask_cors import CORS

PENDING_THRESHOLD = 5 * 60 # 5 minutes in seconds.
OFFLINE_THRESHOLD = 10 * 60 # 10 minutes in seconds.

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")
api = Api(app)

# Establish a connection pool for efficient MariaDB connections 
# Change the pool size to add more accessories!
pool = mariadb.ConnectionPool(
    pool_name="app_pool",
    pool_size=10,
    host=secret.dbhost,
    database=secret.db,
    user=secret.user,
    password=secret.password
)

@app.route('/api/check_device_existence', methods=['POST'])
def check_device_existence():
    try:
        # Extract the accessory ID from the POST request
        device_id = request.json.get('device_id', None)

        if device_id is None:
            return jsonify({"error": "Missing 'device_id' in the request body."}), 400

        # Connect to the database
        conn = pool.get_connection()
        cursor = conn.cursor()

        # Query the database to check if the device_id address exists
        cursor.execute("SELECT COUNT(*) FROM sensor_data WHERE device_id = ?", (device_id,))
        count = cursor.fetchone()[0]
        cursor.close()
        conn.close()

        if count > 0:
            return jsonify({"exists": True}), 200
        else:
            return jsonify({"exists": False}), 200
    except mariadb.Error as e:
        return {"error": f"Database error: {e}"}, 500
    except Exception as e:
        return {"error": f"An error occurred: {e}"}, 500


@socketio.on('get_latest_data')
def get_sensordata_live(data):
    try:
        conn = pool.get_connection()
        cursor = conn.cursor()
        
        device_id = data.get('device_id')
        all_data = data.get('all', False)

        if device_id:
            # Query for the latest data for the specified device_id address.
            query = """
            SELECT * FROM sensor_data
            WHERE device_id = %s
            ORDER BY timestamp DESC
            LIMIT 1;
            """
            cursor.execute(query, (device_id,))
        elif all_data:
            # Reference: https://stackoverflow.com/questions/10999522/how-to-get-the-latest-record-in-each-group-using-group-by
            query = """
            SELECT sd.* FROM sensor_data sd
            INNER JOIN (
                SELECT device_id, MAX(timestamp) as max_timestamp
                FROM sensor_data
                GROUP BY device_id
            ) AS latest_data ON sd.device_id = latest_data.device_id AND sd.timestamp = latest_data.max_timestamp;
            """
            cursor.execute(query)
        else:
            # Default behavior: fetch the latest data.
            query = """
            SELECT * FROM sensor_data
            ORDER BY timestamp DESC
            LIMIT 1;
            """
            cursor.execute(query)
        
        data = cursor.fetchall()
        cursor.close()
        conn.close()
        
        if data:
            current_time_utc = datetime.now(timezone.utc)
            timestamp_utc = data[0][5].replace(tzinfo=timezone.utc)
            time_diff = (current_time_utc - timestamp_utc).total_seconds()
            status = 'online' if time_diff <= PENDING_THRESHOLD else 'pending' if time_diff <= OFFLINE_THRESHOLD else 'offline'
            emit('latest_data_response', [{"id": row[0], "device_id": row[1], "longitude": row[2], "latitude": row[3], "elevation": row[4], "timestamp": row[5].isoformat(), "status": status} for row in data])
        else:
            emit('latest_data_response', {"error": "No data found"}, broadcast=False)
    except mariadb.Error as e:
        emit('latest_data_response', {"error": f"Couldn't access the database: {e}"}, broadcast=False)
    except Exception as e:
        emit('latest_data_response', {"error": f"An error occurred: {e}"}, broadcast=False)


@socketio.on('get_history_data')
def get_history_based_on_days(data):
    try:
        # Get the 'days' and 'device_id' parameters from the request.
        days = data.get('days')
        device_id = data.get('device_id')
    
        # Validate the 'days' parameter.
        if days is not None:
            days = int(days)
            if days < 0 or days > 5: 
                emit('history_data_response', {"error": "Invalid 'days' parameter. Must be between 0 and 5."}, broadcast=False)
                return
        else:
            emit('history_data_response', {"error": "Missing 'days' parameter."}, broadcast=False)
            return
        
        # Validate the 'device_id' parameter.
        if device_id is None:
            emit('history_data_response', {"error": "Missing 'device_id' parameter."}, broadcast=False)
        
        # Calculate the date range.
        current_date = datetime.now(timezone.utc)
        past_date = current_date - timedelta(days=days)
        start_date = past_date.strftime('%Y-%m-%d %H:%M:%S')
        end_date = current_date.strftime('%Y-%m-%d %H:%M:%S')

        # Connect to the database and get all the data based on the timestamp.
        conn = pool.get_connection()
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM sensor_data WHERE timestamp >= '{start_date}' AND timestamp <= '{end_date}' AND device_id = '{device_id}'")
        # cursor.execute(f"SELECT * FROM sensor_data")
        data = cursor.fetchall()
        cursor.close()
        conn.close()
                
        emit('history_data_response', [{"id": row[0], "device_id": row[1], "longitude": row[2], "latitude": row[3], "elevation": row[4], "timestamp": row[5].isoformat()} for row in data])
    except mariadb.Error as e:
        emit('history_data_response', {"error": f"Database error: {e}"}, broadcast=False)
    except Exception as e:
        emit('history_data_response', {"error": f"An error occurred: {e}"}, broadcast=False)


@socketio.on('disconnect')
def on_disconnect():
    socketio.emit('server_status', {"message": "Server is offline."})

@socketio.on('connect')
def on_connect():
    socketio.emit('server_status', {"message": "Server is running."})

if __name__ == '__main__':
    socketio.run(app, debug=True)
