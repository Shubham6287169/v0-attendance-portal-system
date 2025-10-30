# AI-Powered Attendance Portal System

A comprehensive attendance management system with face recognition, geolocation tracking, and real-time analytics.

## Features

- **Face Recognition**: AI-powered face detection and matching for attendance verification
- **Geolocation Tracking**: GPS-based location verification with geofencing
- **Real-time Analytics**: Dashboard with attendance trends and statistics
- **Admin Portal**: Student management and attendance approval workflow
- **Student Dashboard**: Easy attendance marking with multi-factor verification
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Separate admin and student interfaces

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Authentication**: JWT with custom implementation
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser with camera and geolocation support

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

4. Update `.env.local` with your configuration:
   \`\`\`
   JWT_SECRET=your-secret-key-here
   NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
   \`\`\`

5. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Demo Credentials

### Admin Account
- Email: `admin@example.com`
- Password: `password123`

### Student Account
- Email: `student@example.com`
- Password: `password123`

## System Architecture

### Authentication Flow
1. User logs in with email and password
2. Server validates credentials and generates JWT token
3. Token is stored in HTTP-only cookie
4. Middleware verifies token for protected routes

### Attendance Marking Flow
1. Student activates camera for face recognition
2. System captures geolocation with accuracy
3. Geofence validation checks if student is within allowed area
4. Face match confidence is calculated
5. Attendance record is submitted for admin approval
6. Admin reviews and approves/rejects the record

### Geofencing System
- Allowed locations are configured with latitude, longitude, and radius
- Distance calculation uses Haversine formula
- Real-time accuracy information is displayed to users

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/mark` - Get user's attendance records

### Students
- `GET /api/students` - Get all students (admin only)
- `POST /api/students` - Create new student (admin only)

## Component Structure

### Pages
- `/` - Login page
- `/admin` - Admin dashboard with analytics
- `/student` - Student dashboard with attendance marking

### Components
- `FaceRecognition` - Camera and face detection
- `GeolocationTracker` - Location capture and geofence validation
- `AttendanceConfirmation` - Attendance submission confirmation
- `AnalyticsCharts` - Data visualization
- `AnalyticsStats` - Key metrics display

### Utilities
- `lib/jwt.ts` - JWT token creation and verification
- `lib/geolocation.ts` - Geofencing and distance calculations

## Testing

### Manual Testing Checklist

1. **Authentication**
   - [ ] Login with admin credentials
   - [ ] Login with student credentials
   - [ ] Logout functionality
   - [ ] Protected route access

2. **Face Recognition**
   - [ ] Camera activation/deactivation
   - [ ] Face detection simulation
   - [ ] Confidence score display

3. **Geolocation**
   - [ ] Location capture
   - [ ] Accuracy display
   - [ ] Geofence validation
   - [ ] Nearest location calculation

4. **Attendance Marking**
   - [ ] Complete attendance flow
   - [ ] Validation checks
   - [ ] Attendance record creation
   - [ ] History display

5. **Admin Dashboard**
   - [ ] Student management
   - [ ] Attendance approval
   - [ ] Analytics visualization
   - [ ] Statistics calculation

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

\`\`\`bash
npm run build
npm start
\`\`\`

### Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up database for persistence
- [ ] Implement rate limiting
- [ ] Add error logging
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerts

## Future Enhancements

- Real face recognition using TensorFlow.js or face-api.js
- Database integration (Supabase, PostgreSQL)
- Email notifications for attendance status
- Mobile app version
- Attendance reports and exports
- Multi-location support
- Attendance scheduling
- Biometric integration
- Real-time notifications

## Security Considerations

- JWT tokens expire after 24 hours
- Passwords should be hashed in production
- Implement rate limiting on auth endpoints
- Use HTTPS in production
- Validate all user inputs
- Implement CSRF protection
- Use secure cookies with HttpOnly flag

## Troubleshooting

### Camera Not Working
- Check browser permissions
- Ensure HTTPS in production
- Try a different browser
- Check camera hardware

### Location Not Capturing
- Enable location services
- Check browser permissions
- Ensure HTTPS in production
- Verify geolocation API support

### JWT Errors
- Clear browser cookies
- Check JWT_SECRET configuration
- Verify token expiration
- Check middleware configuration

## Support

For issues and questions, please open an issue on GitHub or contact the development team.

## License

MIT License - feel free to use this project for your needs.
