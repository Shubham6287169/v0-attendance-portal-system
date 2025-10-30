# Testing Guide

## Unit Testing

### Authentication Tests
\`\`\`typescript
// Test JWT token creation
const token = createToken({ id: "1", email: "test@example.com" }, "24h")
expect(token).toBeDefined()

// Test token verification
const payload = verifyToken(token)
expect(payload?.id).toBe("1")
\`\`\`

### Geolocation Tests
\`\`\`typescript
// Test distance calculation
const distance = calculateDistance(40.7128, -74.006, 40.758, -73.9855)
expect(distance).toBeGreaterThan(0)

// Test geofence validation
const result = isWithinGeofence(40.7128, -74.006)
expect(result.isValid).toBeDefined()
\`\`\`

## Integration Testing

### Login Flow
1. Navigate to login page
2. Enter admin credentials
3. Click login
4. Verify redirect to admin dashboard
5. Verify user info displayed

### Attendance Flow
1. Login as student
2. Click "Start Camera"
3. Wait for face detection
4. Click "Capture Location"
5. Verify geofence status
6. Click "Mark Attendance"
7. Verify attendance record created

### Admin Approval Flow
1. Login as admin
2. Navigate to Attendance Records tab
3. Find pending record
4. Click approve/reject
5. Verify status updated

## Performance Testing

- Test with 100+ students
- Test with 1000+ attendance records
- Monitor API response times
- Check memory usage
- Verify chart rendering performance

## Security Testing

- Test SQL injection prevention
- Test XSS prevention
- Test CSRF protection
- Test authentication bypass attempts
- Test authorization checks

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Accessibility Testing

- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Form labels
- ARIA attributes
