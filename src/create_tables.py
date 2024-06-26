import psycopg2
from psycopg2 import sql
# I have added my postgres
# Define your database connection parameters
DB_NAME = 'stonks'
DB_USER = 'postgres'
DB_PASSWORD = 'PASSWORD'
DB_HOST = 'localhost'
DB_PORT = '5432' 

# Connect to your PostgreSQL database
try:
    connection = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    connection.autocommit = True
    cursor = connection.cursor()
    print("Connected to the database.")

    # Create the profiles table
    create_profiles_table_query = '''
    CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY,
        fullName VARCHAR(255),
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255),
        active BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    '''
    cursor.execute(create_profiles_table_query)
    print("Profiles table created successfully.")

    # If you need to create follower table
    create_followers_table_query = '''
    CREATE TABLE IF NOT EXISTS followers (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES profiles(id) ON DELETE CASCADE,
    follower_id INT REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );'''
    cursor.execute(create_followers_table_query)
    print("Another table created successfully.")

    create_id_table_query = '''
    CREATE TABLE two_factor_auth (
    user_id UUID PRIMARY KEY,
    secret VARCHAR NOT NULL,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    );'''
    cursor.execute(create_id_table_query)
    print("ID table created successfully.")

    
    create_channel_table_query = '''
    CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );'''
    cursor.execute(create_channel_table_query)

    create_fcm_table_query = '''
    CREATE TABLE IF NOT EXISTS fcm_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES profiles(id) ON DELETE CASCADE,
    fcm_token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );'''
    cursor.execute(create_fcm_table_query)


    # cursor.execute("DELETE FROM profiles")
except Exception as error:
    print(f"Error connecting to the database: {error}")
finally:
    if connection:
        cursor.close()
        connection.close()
        print("Database connection closed.")
