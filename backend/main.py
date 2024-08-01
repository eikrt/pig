from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image
import random
from io import BytesIO
import sqlite3
import json
A4_SIZE_W = 842 
A4_SIZE_H = 595
gnodes = [{'type': 'root'}]

def create_database():
    # Connect to the SQLite database (or create it if it doesn't exist)
    conn = sqlite3.connect('nodes.db')
    cursor = conn.cursor()

    # Create the table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nodes TEXT NOT NULL
    )
    ''')

    # Commit changes and close the connection
    conn.commit()
    conn.close()
def insert_node(nodes):
    conn = sqlite3.connect('nodes.db')
    cursor = conn.cursor()
    nodes_json = json.dumps(nodes)  # Convert list of objects to JSON string
    cursor.execute('''
    INSERT INTO nodes (nodes) VALUES (?)
    ''', (nodes_json,))
    conn.commit()
    conn.close()
def flush_database():
    # Connect to the SQLite database
    conn = sqlite3.connect('nodes.db')
    cursor = conn.cursor()

    # Delete all records from the nodes table
    cursor.execute('DELETE FROM nodes')

    # Commit changes and close the connection
    conn.commit()
    conn.close()
def retrieve_nodes():
    conn = sqlite3.connect('nodes.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM nodes')
    rows = cursor.fetchall()
    conn.close()
    return [(row[0], json.loads(row[1])) for row in rows]
def recur_image(pixels, nodes):

    # Iterate through each pixel
    if nodes[0]['type'] == 'white_noise':
        for i in range(A4_SIZE_W):
            for j in range(A4_SIZE_H):
                # Generate random color for each pixel
                r = random.randint(0, 255)
                g = random.randint(0, 255)
                b = random.randint(0, 255)
                pixels[i, j] = (r, g, b)
    nodes.pop(0)
    if len(nodes) == 0:
        return pixels
    recur_image(pixels,nodes) 

def generate_bitmap_image(nodes):
    # Create a new image with RGB mode
    
    img = Image.new('RGB', (A4_SIZE_W, A4_SIZE_H), 'white')
    pixels = img.load()
    print(nodes[0][1])
    pixels = recur_image(pixels,nodes[0][1])
    # Save the image to a BytesIO object
    print(img.load()[0,0])
    img_io = BytesIO()
    img.save(img_io, 'BMP')
    img_io.seek(0)
    return img_io

def generate_handler(nodes):
    insert_node(nodes)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
@app.route('/api/get_image', methods=['GET'])
def get_image():
    return send_file(generate_bitmap_image(retrieve_nodes()), mimetype='image/bmp')

@app.route('/api/generate', methods=['POST'])
def generate():
    try:
        flush_database()
        data = request.get_json()
        nodes = data.get('nodes')
        generate_handler(nodes)
        # Process the nodes as needed
        response_data = {'message': 'Nodes processed successfully'}
         
        return jsonify(response_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    create_database()
    app.run(port=3001)
