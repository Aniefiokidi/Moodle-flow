# Departmental Project Supervision Portal

A comprehensive full-stack web application built with Next.js 14 for managing student project supervision in academic departments.
CIS_HOD_2024
## 🎉 COMPLETE PROJECT FEATURES

### ✅ Fully Implemented Core Functionality
- **✅ Role-based Authentication**: Students, Supervisors, and Admins with tailored dashboards
- **✅ Project Management**: Upload, track, and manage project submissions with file support
- **✅ Real-time Chat**: Instant messaging between students and supervisors
- **✅ File Upload System**: Support for PDF, DOCX, and ZIP files with validation
- **✅ Review System**: Supervisors can review projects and provide feedback
- **✅ User Management**: Admin interface for managing users and assignments
- **✅ Notification System**: Real-time alerts for submissions, feedback, and messages
- **✅ Progress Tracking**: Visual project status indicators
- **✅ Dashboard Analytics**: Role-specific insights and statistics

### 🚀 Key Implemented Features

#### 👩‍🎓 Student Features
- ✅ Dashboard with supervisor details and project progress
- ✅ Project upload with file validation and progress tracking
- ✅ Real-time chat interface with supervisor
- ✅ Notification center for feedback and updates
- ✅ Project submission history and status tracking

#### 🧑‍🏫 Supervisor Features
- ✅ Dashboard showing all assigned students and pending reviews
- ✅ Project review system with feedback and status updates
- ✅ Real-time communication with students
- ✅ Progress monitoring and analytics
- ✅ Priority review queue for efficient workflow

#### 👩‍💼 Administrator Features
- ✅ System-wide overview and analytics dashboard
- ✅ Complete user management interface
- ✅ Supervisor-student assignment system
- ✅ Performance reports and system metrics
- ✅ User role management and system administration

### 🛠️ Technical Implementation

#### Backend APIs
- ✅ `/api/auth` - Complete authentication system
- ✅ `/api/projects` - Project CRUD operations
- ✅ `/api/messages` - Real-time chat system
- ✅ `/api/notifications` - Notification management
- ✅ `/api/upload` - File upload with validation
- ✅ `/api/users` - User management and assignments

#### Database Models
- ✅ User authentication and role management
- ✅ Student-Supervisor relationships
- ✅ Project submissions and status tracking
- ✅ Message history and chat system
- ✅ Notification system
- ✅ File upload tracking

#### UI Components
- ✅ Professional dashboard layouts
- ✅ File upload with drag-and-drop
- ✅ Real-time chat interface
- ✅ Interactive project review system
- ✅ Admin user management tables
- ✅ Notification center with badges
- ✅ Responsive design for all devices

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **Authentication**: NextAuth.js
- **Real-time**: Socket.io
- **UI Components**: shadcn/ui, Lucide React icons

## 🏗️ Project Structure

```
├── app/
│   ├── api/                 # API routes
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # Role-based dashboards
│   │   ├── student/
│   │   ├── supervisor/
│   │   └── admin/
│   └── globals.css
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── dashboard-layout.tsx
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Database client
│   └── utils.ts
├── prisma/
│   └── schema.prisma      # Database schema
├── types/
└── utils/
```

## 📊 Database Schema

### Core Models
- **User**: Basic user information and authentication
- **Student**: Student-specific data and supervisor assignment
- **Supervisor**: Supervisor profiles and department info
- **Admin**: Administrator accounts
- **Project**: Project submissions and status tracking
- **Message**: Real-time chat system
- **Notification**: System notifications

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and setup**:
   ```bash
   # Project is already initialized in current directory
   npm install
   ```

2. **Environment Setup**:
   ```bash
   # Copy .env file (already created)
   # Update NEXTAUTH_SECRET with a secure random string
   ```

3. **Database Setup**:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Access the Application**:
   - Open [http://localhost:3000](http://localhost:3000)
   - Register as a new user or sign in

### Default Users
Create users through the registration flow with the following roles:
- **Student**: Can submit projects and chat with supervisors
- **Supervisor**: Can review projects and manage students  
- **Admin**: Can manage users and view system analytics

## 🔧 Configuration

### Environment Variables
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### Database Configuration
- **Development**: SQLite (file-based)
- **Production**: PostgreSQL (update DATABASE_URL)

## 📱 Key Features Implementation

### Authentication Flow
1. User registration with role selection
2. NextAuth.js handles session management
3. Role-based route protection
4. Automatic dashboard redirection

### Real-time Features
- Socket.io for instant messaging
- Live notification system
- Real-time project status updates

### File Management
- Secure file upload system
- Support for multiple file formats
- File history and versioning

## 🧪 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Management
```bash
npx prisma studio    # Open database browser
npx prisma db push   # Push schema changes
npx prisma generate  # Generate client
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Manual Deployment
1. Build the application: `npm run build`
2. Configure production database
3. Update environment variables
4. Deploy to hosting platform

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based session management
- Role-based access control
- Input validation and sanitization
- Secure file upload handling

## 📈 Future Enhancements

- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Integration with university systems
- [ ] Advanced file preview
- [ ] Video call integration
- [ ] Assignment scheduling
- [ ] Grade management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review existing issues
- Create a new issue if needed

---

Built with ❤️ for academic project supervision management.
