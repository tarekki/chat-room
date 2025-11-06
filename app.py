from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

# Database file path
DATABASE = 'chat.db'

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database and create tables"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            sender_username TEXT NOT NULL,
            receiver_id INTEGER,
            message TEXT NOT NULL,
            chat_type TEXT NOT NULL DEFAULT 'public',
            reply_to_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (receiver_id) REFERENCES users(id),
            FOREIGN KEY (reply_to_id) REFERENCES messages(id)
        )
    ''')
    
    # Add reply_to_id column if it doesn't exist (for existing databases)
    try:
        cursor.execute('ALTER TABLE messages ADD COLUMN reply_to_id INTEGER')
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Create active_users table (track who is online)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS active_users (
            user_id INTEGER PRIMARY KEY,
            username TEXT NOT NULL,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database when app starts
if not os.path.exists(DATABASE):
    init_db()
else:
    # If database exists, make sure tables are created
    init_db()

@app.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'success': False, 'message': 'Username and password are required'}), 400
        
        username = data.get('username').strip()
        password = data.get('password')
        
        # Validate username length
        if len(username) < 3:
            return jsonify({'success': False, 'message': 'Username must be at least 3 characters'}), 400
        
        # Validate password length
        if len(password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
        
        # Check if username already exists
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            conn.close()
            return jsonify({'success': False, 'message': 'Username already exists'}), 400
        
        # Hash password before storing
        hashed_password = generate_password_hash(password)
        
        # Insert new user into database
        cursor.execute(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            (username, hashed_password)
        )
        conn.commit()
        conn.close()
        
        # Return success response
        return jsonify({
            'success': True,
            'message': 'Registration successful'
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'message': 'Server error: ' + str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'success': False, 'message': 'Username and password are required'}), 400
        
        username = data.get('username').strip()
        password = data.get('password')
        
        # Get user from database
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT id, username, password FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        conn.close()
        
        # Check if user exists
        if not user:
            return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
        
        # Verify password
        if not check_password_hash(user['password'], password):
            return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
        
        # Login successful
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'username': user['username']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': 'Server error: ' + str(e)}), 500

@app.route('/messages', methods=['GET'])
def get_messages():
    """Get messages - public or private"""
    try:
        user_id = request.args.get('user_id', type=int)
        chat_type = request.args.get('chat_type', 'public')
        receiver_id = request.args.get('receiver_id', type=int)
        
        conn = get_db()
        cursor = conn.cursor()
        
        if chat_type == 'public':
            # Get all public messages with reply info
            cursor.execute('''
                SELECT m.id, m.sender_id, m.sender_username, m.message, m.created_at, 
                       m.reply_to_id, 
                       rm.message as reply_to_message, 
                       rm.sender_username as reply_to_username
                FROM messages m
                LEFT JOIN messages rm ON m.reply_to_id = rm.id
                WHERE m.chat_type = 'public'
                ORDER BY m.created_at DESC
                LIMIT 100
            ''')
        else:
            # Get private messages between two users with reply info
            if not user_id or not receiver_id:
                conn.close()
                return jsonify({'success': False, 'message': 'user_id and receiver_id required for private chat'}), 400
            
            cursor.execute('''
                SELECT m.id, m.sender_id, m.sender_username, m.message, m.created_at,
                       m.reply_to_id,
                       rm.message as reply_to_message,
                       rm.sender_username as reply_to_username
                FROM messages m
                LEFT JOIN messages rm ON m.reply_to_id = rm.id
                WHERE m.chat_type = 'private'
                AND ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
                ORDER BY m.created_at ASC
            ''', (user_id, receiver_id, receiver_id, user_id))
        
        messages = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        messages_list = []
        for msg in messages:
            message_dict = {
                'id': msg['id'],
                'sender_id': msg['sender_id'],
                'sender_username': msg['sender_username'],
                'message': msg['message'],
                'created_at': msg['created_at']
            }
            # Add reply info if exists
            if msg['reply_to_id']:
                message_dict['reply_to_id'] = msg['reply_to_id']
                message_dict['reply_to_message'] = msg['reply_to_message']
                message_dict['reply_to_username'] = msg['reply_to_username']
            messages_list.append(message_dict)
        
        return jsonify({
            'success': True,
            'messages': messages_list
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': 'Server error: ' + str(e)}), 500

@app.route('/messages', methods=['POST'])
def send_message():
    """Send a message"""
    try:
        data = request.get_json()
        
        if not data or not data.get('sender_id') or not data.get('message'):
            return jsonify({'success': False, 'message': 'sender_id and message are required'}), 400
        
        sender_id = data.get('sender_id')
        message = data.get('message').strip()
        chat_type = data.get('chat_type', 'public')
        receiver_id = data.get('receiver_id')
        
        if not message:
            return jsonify({'success': False, 'message': 'Message cannot be empty'}), 400
        
        # Get sender username
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT username FROM users WHERE id = ?', (sender_id,))
        sender = cursor.fetchone()
        
        if not sender:
            conn.close()
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        sender_username = sender['username']
        reply_to_id = data.get('reply_to_id')
        
        # Insert message
        if chat_type == 'private':
            if not receiver_id:
                conn.close()
                return jsonify({'success': False, 'message': 'receiver_id required for private messages'}), 400
            if reply_to_id:
                cursor.execute('''
                    INSERT INTO messages (sender_id, sender_username, receiver_id, message, chat_type, reply_to_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (sender_id, sender_username, receiver_id, message, chat_type, reply_to_id))
            else:
                cursor.execute('''
                    INSERT INTO messages (sender_id, sender_username, receiver_id, message, chat_type)
                    VALUES (?, ?, ?, ?, ?)
                ''', (sender_id, sender_username, receiver_id, message, chat_type))
        else:
            if reply_to_id:
                cursor.execute('''
                    INSERT INTO messages (sender_id, sender_username, message, chat_type, reply_to_id)
                    VALUES (?, ?, ?, ?, ?)
                ''', (sender_id, sender_username, message, chat_type, reply_to_id))
            else:
                cursor.execute('''
                    INSERT INTO messages (sender_id, sender_username, message, chat_type)
                    VALUES (?, ?, ?, ?)
                ''', (sender_id, sender_username, message, chat_type))
        
        conn.commit()
        message_id = cursor.lastrowid
        
        # Get the created message
        cursor.execute('''
            SELECT id, sender_id, sender_username, message, created_at
            FROM messages
            WHERE id = ?
        ''', (message_id,))
        new_message = cursor.fetchone()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': {
                'id': new_message['id'],
                'sender_id': new_message['sender_id'],
                'sender_username': new_message['sender_username'],
                'message': new_message['message'],
                'created_at': new_message['created_at']
            }
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'message': 'Server error: ' + str(e)}), 500

@app.route('/active-users', methods=['GET'])
def get_active_users():
    """Get active/online users"""
    try:
        user_id = request.args.get('user_id', type=int)
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Update or insert active user
        if user_id:
            cursor.execute('SELECT username FROM users WHERE id = ?', (user_id,))
            user = cursor.fetchone()
            if user:
                cursor.execute('''
                    INSERT OR REPLACE INTO active_users (user_id, username, last_seen)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                ''', (user_id, user['username']))
                conn.commit()
        
        # Get all active users (last seen within last 5 minutes)
        cursor.execute('''
            SELECT user_id, username, last_seen
            FROM active_users
            WHERE datetime(last_seen) > datetime('now', '-5 minutes')
            ORDER BY username
        ''')
        
        active_users = cursor.fetchall()
        conn.close()
        
        users_list = []
        for user in active_users:
            users_list.append({
                'user_id': user['user_id'],
                'username': user['username'],
                'last_seen': user['last_seen']
            })
        
        return jsonify({
            'success': True,
            'active_users': users_list
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': 'Server error: ' + str(e)}), 500

@app.route('/users', methods=['GET'])
def get_all_users():
    """Get all registered users with last seen"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get all users with their last seen from active_users table
        cursor.execute('''
            SELECT u.id, u.username, 
                   COALESCE(au.last_seen, NULL) as last_seen
            FROM users u
            LEFT JOIN active_users au ON u.id = au.user_id
            ORDER BY u.username
        ''')
        users = cursor.fetchall()
        conn.close()
        
        users_list = []
        for user in users:
            users_list.append({
                'id': user['id'],
                'username': user['username'],
                'last_seen': user['last_seen']
            })
        
        return jsonify({
            'success': True,
            'users': users_list
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': 'Server error: ' + str(e)}), 500

@app.route('/messages/<int:message_id>/delete', methods=['POST'])
def delete_message(message_id):
    """Delete a message"""
    try:
        # Try to get user_id from JSON body first, then from query params
        data = request.get_json() or {}
        user_id = data.get('user_id') or request.args.get('user_id', type=int)
        
        if not user_id:
            return jsonify({'success': False, 'message': 'user_id is required'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if message exists and belongs to user
        cursor.execute('''
            SELECT sender_id FROM messages WHERE id = ?
        ''', (message_id,))
        message = cursor.fetchone()
        
        if not message:
            conn.close()
            return jsonify({'success': False, 'message': 'Message not found'}), 404
        
        if message['sender_id'] != user_id:
            conn.close()
            return jsonify({'success': False, 'message': 'You can only delete your own messages'}), 403
        
        # Delete the message
        cursor.execute('DELETE FROM messages WHERE id = ?', (message_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Message deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': 'Server error: ' + str(e)}), 500

if __name__ == '__main__':
    # Get port from environment variable (for cloud deployment) or use 5000 for local
    port = int(os.environ.get('PORT', 5000))
    # Use debug=False in production, debug=True only for local development
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug_mode, host='0.0.0.0', port=port)

