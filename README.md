# Full Stack Chat Application

A real-time chat application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring both individual and group chat functionalities.

## Screenshots

### Authentication
![Login Page](/frontend/public/screenshots/login.png)
*Login page with form validation*

![Registration Page](/frontend/public/screenshots/register.png)
*User registration page*

### Chat Interface
![Main Chat Interface](/frontend/public/screenshots/main-chat.png)
*Main chat interface with sidebar and message container*

![Group Chat](/frontend/public/screenshots/group-chat.png)
*Group chat interface with member list*

## Detailed API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "string",
      "username": "string",
      "email": "string"
    },
    "token": "string"
  }
}
```

#### Login User
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "string",
      "username": "string",
      "email": "string"
    },
    "token": "string"
  }
}
```

### Message Endpoints

#### Send Message
```http
POST /api/messages/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": "string",
  "message": "string"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "_id": "string",
      "sender": "string",
      "receiver": "string",
      "message": "string",
      "createdAt": "string"
    }
  }
}
```

#### Get Chat History
```http
GET /api/messages/chat/:chatId
Authorization: Bearer <token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "string",
        "sender": "string",
        "receiver": "string",
        "message": "string",
        "createdAt": "string"
      }
    ]
  }
}
```

### Group Endpoints

#### Create Group
```http
POST /api/groups/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "members": ["string"]
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "group": {
      "_id": "string",
      "name": "string",
      "members": ["string"],
      "createdBy": "string",
      "createdAt": "string"
    }
  }
}
```

#### Get Groups
```http
GET /api/groups
Authorization: Bearer <token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "_id": "string",
        "name": "string",
        "members": ["string"],
        "createdBy": "string",
        "createdAt": "string"
      }
    ]
  }
}
```

#### Delete Group
```http
DELETE /api/groups/:groupId
Authorization: Bearer <token>
```
**Response:**
```json
{
  "success": true,
  "message": "Group deleted successfully"
}
```

### User Endpoints

#### Search Users
```http
GET /api/users/search?query=string
Authorization: Bearer <token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "string",
        "username": "string",
        "email": "string"
      }
    ]
  }
}
```

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "string",
      "username": "string",
      "email": "string",
      "createdAt": "string"
    }
  }
}
```

### Socket.IO Events

#### Client Events
- `setup`: Emitted when user connects
- `join chat`: Emitted when user joins a chat
- `typing`: Emitted when user starts typing
- `stop typing`: Emitted when user stops typing
- `new message`: Emitted when sending a new message

#### Server Events
- `connected`: Emitted when user connects successfully
- `typing`: Emitted when other user is typing
- `stop typing`: Emitted when other user stops typing
- `message received`: Emitted when new message is received

## Features

### Authentication & User Management
- **User Registration & Login**
  - Secure user authentication using JWT (JSON Web Tokens)
  - Password hashing for security
  - Form validation for user inputs
  - Persistent login sessions

### Individual Chat Features
- **Real-time Messaging**
  - Instant message delivery using Socket.IO
  - Message status indicators (sent, delivered, read)
  - Message timestamps
  - Support for text messages

- **Chat Management**
  - Create new individual chats
  - Delete existing chats
  - View chat history
  - Search users to start new conversations
  - Online/offline status indicators

### Group Chat Features
- **Group Management**
  - Create new groups
  - Add/remove group members
  - Delete groups
  - View group members
  - Group chat persistence across sessions

- **Group Messaging**
  - Real-time group messages
  - Message history for groups
  - Group member status indicators

### UI/UX Features
- **Responsive Design**
  - Mobile-friendly interface
  - Dark/Light theme support
  - Smooth animations and transitions

- **User Interface**
  - Sidebar navigation
  - Chat container with message bubbles
  - User/Group search functionality
  - Loading states and error handling
  - Toast notifications for actions

## Technical Implementation

### Backend Architecture
- **Server Setup**
  - Express.js server with middleware configuration
  - MongoDB database connection
  - Socket.IO for real-time communication
  - JWT authentication middleware

- **API Endpoints**
  - User routes: `/api/users/*`
    - Registration
    - Login
    - Get user profile
    - Search users
  - Message routes: `/api/messages/*`
    - Send messages
    - Get chat history
    - Delete messages
  - Group routes: `/api/groups/*`
    - Create groups
    - Get group details
    - Delete groups
    - Manage group members

### Frontend Architecture
- **State Management**
  - Zustand for global state management
  - Persistent storage for selected chats
  - Real-time state updates with Socket.IO

- **Component Structure**
  - Authentication components
  - Chat components
  - Group management components
  - UI components (Sidebar, MessageBubble, etc.)

## Workflow

### User Authentication Flow
1. User visits the application
2. If not logged in, redirected to login page
3. User can either:
   - Log in with existing credentials
   - Register a new account
4. Upon successful authentication, redirected to chat interface

### Individual Chat Flow
1. User can search for other users in the sidebar
2. Click on a user to start a new chat
3. Messages are sent in real-time
4. Chat history is loaded automatically
5. Users can delete individual chats

### Group Chat Flow
1. User can create a new group from the sidebar
2. Add members to the group
3. Start group conversation
4. Messages are delivered to all group members
5. Group chat persists across sessions
6. Group can be deleted by any member

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation
1. Clone the repository
```bash
git clone <repository-url>
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd frontend
npm install
```

4. Set up environment variables
- Create `.env` files in both backend and frontend directories
- Add necessary environment variables (MongoDB URI, JWT Secret, etc.)

5. Start the development servers
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server
cd frontend
npm run dev
```

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

## Technologies Used
- **Frontend**
  - React.js
  - Zustand
  - Socket.IO Client
  - Axios
  - Tailwind CSS

- **Backend**
  - Node.js
  - Express.js
  - MongoDB
  - Socket.IO
  - JWT
  - Bcrypt

## Security Features
- JWT-based authentication
- Password hashing
- Protected routes
- Input validation
- CORS configuration
- Rate limiting

## Future Enhancements
- File sharing capabilities
- Voice and video calls
- Message reactions
- Message editing
- User profile customization
- Message encryption
- Group roles and permissions
