# Financial Health Manager - Frontend

A modern React TypeScript application for personal financial management and analysis.

## Features

- 🔐 **Secure Authentication** - User registration, login, and password reset
- 📊 **Financial Dashboard** - Comprehensive overview of income, expenses, and savings
- 📈 **Data Visualization** - Interactive charts and graphs using Recharts
- 📤 **CSV Upload** - Drag-and-drop file upload with progress tracking
- 🔍 **Transaction Management** - Advanced filtering, sorting, and search
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- 🔄 **Real-time Updates** - Live data synchronization with PocketBase
- 🚀 **Performance Optimized** - Efficient data fetching and caching with TanStack Query

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **TanStack Query** for data fetching and caching
- **React Router** for navigation
- **React Hook Form** for form management
- **React Dropzone** for file uploads
- **Recharts** for data visualization
- **PocketBase** for real-time updates and authentication
- **Heroicons** for icons

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Running FastAPI backend on port 8000
- Running PocketBase instance on port 8090

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_POCKETBASE_URL=http://localhost:8090
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard components
│   ├── transactions/    # Transaction management
│   ├── upload/          # File upload components
│   └── common/          # Shared components
├── contexts/            # React contexts (Auth)
├── hooks/               # Custom React hooks
├── services/            # API services and clients
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── main.tsx            # Application entry point
```

## Key Components

### Authentication System
- **AuthProvider**: Manages user authentication state
- **LoginForm**: User login with validation
- **RegisterForm**: User registration with password strength
- **ProtectedRoute**: Route protection for authenticated users

### Dashboard Components
- **FinancialSummary**: Key metrics and insights
- **CategoryChart**: Expense breakdown visualization
- **TransactionTable**: Sortable and filterable transaction list
- **FileUpload**: CSV file upload with progress tracking

### Data Management
- **API Service**: Centralized API communication
- **React Query Hooks**: Data fetching, caching, and synchronization
- **Real-time Updates**: PocketBase subscription management

## API Integration

The frontend integrates with:

1. **FastAPI Backend** (`localhost:8000`):
   - CSV upload and processing
   - Financial calculations and analysis
   - Transaction CRUD operations
   - AI-powered insights

2. **PocketBase** (`localhost:8090`):
   - User authentication and management
   - Real-time data synchronization
   - File storage and metadata

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | FastAPI backend URL | `http://localhost:8000` |
| `VITE_POCKETBASE_URL` | PocketBase instance URL | `http://localhost:8090` |

## Build and Deployment

### Production Build
```bash
npm run build
```

The built files will be in the `dist` directory.

### Deployment Options

- **Vercel**: Automatic deployments from Git (recommended)
- **Netlify**: Static site hosting with form handling
- **S3 + CloudFront**: AWS static site hosting
- **GitHub Pages**: Free hosting for public repositories

### Environment Configuration

For production, set environment variables in your hosting platform:

- Vercel: Project settings → Environment Variables
- Netlify: Site settings → Environment variables
- AWS: CloudFormation or manual configuration

## Features in Detail

### Real-time Data Updates
The application uses PocketBase subscriptions to provide real-time updates:
- Transaction changes reflect immediately
- Upload status updates in real-time
- Multi-device synchronization

### Data Visualization
- Interactive pie charts for expense categories
- Responsive design for mobile and desktop
- Custom tooltips with formatted currency
- Color-coded financial health indicators

### File Upload System
- Drag-and-drop interface
- Progress tracking with visual feedback
- File validation (CSV only, size limits)
- Error handling with user-friendly messages

### Transaction Management
- Advanced filtering by date, category, account, type
- Full-text search across transaction descriptions
- Sortable columns with visual indicators
- Pagination for large datasets

## Performance Considerations

- **Code Splitting**: Dynamic imports for route-based splitting
- **Caching**: TanStack Query for efficient data caching
- **Lazy Loading**: Components loaded on demand
- **Optimized Builds**: Vite's optimized production builds

## Browser Support

- Modern browsers with ES2020 support
- Chrome 88+, Firefox 78+, Safari 14+, Edge 88+
- Mobile browsers on iOS 14+ and Android 10+

## Contributing

1. Follow the established code style and TypeScript patterns
2. Add tests for new components and hooks
3. Update documentation for new features
4. Ensure all builds pass before submitting PRs

## Troubleshooting

### Common Issues

1. **API Connection Failed**:
   - Check that FastAPI backend is running on port 8000
   - Verify CORS settings in backend
   - Check network connectivity

2. **Authentication Issues**:
   - Ensure PocketBase is running on port 8090
   - Clear browser storage and try again
   - Check PocketBase admin panel for user records

3. **Build Errors**:
   - Clear node_modules and reinstall dependencies
   - Check TypeScript errors with `npm run build`
   - Verify all environment variables are set

4. **Real-time Updates Not Working**:
   - Check browser developer tools for WebSocket connections
   - Verify PocketBase URL and authentication
   - Check network firewall settings

For more help, check the main project README or create an issue in the repository.