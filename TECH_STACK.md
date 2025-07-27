# Financial Health Manager - Tech Stack & Migration Plan

## Overview

This document outlines the technology stack and migration plan for transforming the Financial Health Manager from a CLI/API application into a modern web application for personal financial analysis and insights.

## Current Application State

- **CLI Interface**: Python-based command line tool for CSV processing
- **FastAPI Server**: HTTP endpoints for file upload and analysis
- **FastMCP Integration**: MCP server for LLM agent interaction
- **Core Features**: CSV parsing, transaction categorization, savings rate calculation, YoY analysis

## Proposed Tech Stack

### ✅ Core Frontend Stack
- **React 18** - Modern UI framework for building interactive financial dashboards
- **Vite** - Fast build tool and development server with HMR
- **TypeScript** - Type-safe development for financial data handling
- **Tailwind CSS** - Utility-first CSS for rapid UI development

### ✅ Backend Architecture
- **FastAPI** - High-performance API for financial calculations and CSV processing
- **Pydantic** - Data validation and serialization (already in use)
- **PocketBase** - Handles user data persistence, authentication, and file storage
- **FastMCP** - MCP server for LLM financial insights (already implemented)

### ✅ Database & Storage
- **SQLite** - Lightweight database via PocketBase for user transactions
- **PocketBase File Storage** - Built-in file handling for CSV uploads and user data
- **~~PocketBase Real-time API~~** - *(Optional for financial data - not critical)*

### ✅ Authentication & Security
- **PocketBase Auth** - Built-in user management for personal finance data
- **OAuth Integration** - Social login options via PocketBase

### ✅ Development Tools
- **uv** - Fast Python package manager (already in use)
- **ruff** - Python linting and code formatting (already configured)
- **Docker Compose** - Local development orchestration

## Deployment & Infrastructure

### ✅ Production Deployment
- **Frontend**: **Vercel** - Global CDN with automatic deployments from Git
- **Backend**: **OCI VM** - Cost-effective self-hosting with systemd
  - FastAPI service (financial calculations)
  - PocketBase instance (user data & auth)
  - FastMCP server (AI insights)
- **Reverse Proxy**: **Caddy** - Automatic HTTPS and API routing
- **Containerization**: **Multi-stage Docker builds** - Optimized production images

### ⚠️ Technologies Not Critical for Financial App

- **~~Real-time API~~** - Financial data doesn't require live updates
- **~~WebSockets~~** - Not needed for transaction analysis workflows
- **~~Advanced Caching~~** - CSV processing is fast enough without Redis/Memcached

### ❌ Technologies Not Needed

- **~~Database Migrations~~** - PocketBase handles schema changes automatically
- **~~Complex State Management~~** - React state + local storage sufficient for financial UI
- **~~GraphQL~~** - REST API adequate for financial data operations

## Migration Plan

### Phase 1: Backend Foundation (Week 1-2)

The foundation phase focuses on reorganizing the existing codebase and setting up the data persistence layer. This phase establishes the groundwork for user authentication, data storage, and enhanced API capabilities.

#### Step 1: Reorganize Backend Structure
**Purpose**: Transform the current flat file structure into a professional backend architecture that separates concerns and prepares for scalability.

**What to implement**: Create a dedicated backend directory and move all server-side files (app.py, server.py, fhm/ module, and pyproject.toml) into this organized structure. This reorganization makes the codebase more maintainable and prepares it for containerization.

**Key considerations**: Update any import paths that reference the moved modules. Ensure the FastMCP server and FastAPI application still function correctly after the move. Create a requirements.txt file from the existing pyproject.toml for easier deployment and dependency management.

**Expected outcome**: A clean backend/ directory containing all server-side code, with working imports and a deployment-ready requirements file.

#### Step 2: Set up PocketBase Infrastructure
**Purpose**: Establish PocketBase as the primary database and authentication system for user data persistence and file storage.

**What to implement**: Download and configure PocketBase as a standalone service that will handle user authentication, transaction storage, and CSV file management. Set up the PocketBase admin interface for database schema management.

**Key considerations**: PocketBase should run as a separate service from the FastAPI application, typically on port 8090. Create startup scripts for easy development. Understand that PocketBase provides both a database backend and an admin UI for managing data schemas and user accounts.

**Expected outcome**: A running PocketBase instance with admin access, ready for schema definition and integration with the FastAPI backend.

#### Step 3: Define Data Schema and Collections
**Purpose**: Create a structured data model that supports user authentication, transaction storage, and file upload tracking.

**What to implement**: Design and create three main PocketBase collections: a users collection (extending the built-in auth collection) for storing user preferences and profile information, a transactions collection for storing parsed CSV transaction data with proper relationships to users, and an uploads collection for tracking CSV file uploads and their processing status.

**Key considerations**: The transactions collection should store individual transaction records with fields for date, description, amount, category, account type, and a reference to the user who owns them. The uploads collection should track file metadata, processing status, and link to the created transactions. Design the schema to support efficient querying for financial analysis and reporting.

**Expected outcome**: Three properly configured PocketBase collections with appropriate field types, relationships, and validation rules that support the financial data workflow.

#### Step 4: Enhance FastAPI Integration
**Purpose**: Extend the existing FastAPI application to integrate with PocketBase for user authentication and data persistence.

**What to implement**: Create a PocketBase client wrapper that handles authentication and data operations. Modify existing FastAPI endpoints to save parsed transaction data to PocketBase. Add user authentication middleware that validates JWT tokens from PocketBase. Implement new endpoints for user dashboard data, transaction retrieval with filtering, and enhanced financial analysis.

**Key considerations**: The integration should maintain backward compatibility with existing endpoints while adding new authenticated endpoints. Implement proper error handling for database operations and authentication failures. Ensure that transaction data is properly associated with authenticated users and that users can only access their own financial data.

**Expected outcome**: An enhanced FastAPI application that seamlessly integrates with PocketBase, providing authenticated endpoints for financial data management while preserving existing functionality.

### Phase 2: Frontend Development (Week 2-4)

The frontend phase focuses on creating a modern React application that provides an intuitive user interface for financial data management and analysis. This phase builds the user-facing components and integrates them with the backend APIs.

#### Step 5: Initialize React Application Structure
**Purpose**: Create a modern React TypeScript application with Vite as the build tool, establishing the foundation for a responsive and performant financial dashboard.

**What to implement**: Set up a new Vite-based React TypeScript project in the frontend directory. Configure the build system with hot module replacement for efficient development. Establish the basic project structure with proper TypeScript configuration and build scripts.

**Key considerations**: Vite provides faster build times and better development experience compared to Create React App. TypeScript ensures type safety when working with financial data. The project structure should be scalable and organized to accommodate multiple components, services, and utilities.

**Expected outcome**: A running React TypeScript application with Vite, accessible on localhost with hot reloading enabled, ready for component development.

#### Step 6: Install and Configure Core Dependencies
**Purpose**: Set up the essential libraries and tools needed for building a comprehensive financial application with modern UI components, data visualization, and API integration.

**What to implement**: Install UI framework components (Headless UI, Heroicons), charting libraries (Recharts) for financial visualizations, routing for navigation (React Router), state management and API integration (TanStack Query), form handling (React Hook Form), file upload capabilities (React Dropzone), and PocketBase client for authentication. Configure Tailwind CSS for styling with custom design tokens for financial UI patterns.

**Key considerations**: Choose libraries that work well together and provide the functionality needed for financial data presentation. Recharts is specifically good for financial charts like line graphs and pie charts. TanStack Query (formerly React Query) provides excellent API state management with caching and error handling. Configure Tailwind with custom colors and utility classes that match financial app design patterns.

**Expected outcome**: A fully configured development environment with all necessary dependencies installed and Tailwind CSS configured with financial app styling ready for component development.

#### Step 7: Implement Core Authentication Components
**Purpose**: Build the authentication system that allows users to securely log in, register, and manage their accounts using PocketBase as the authentication provider.

**What to implement**: Create a comprehensive authentication context using React Context API that manages user state throughout the application. Build login and registration forms with proper validation and error handling. Implement password reset functionality and email verification flows. Create protected route components that require authentication. Design user-friendly authentication UI components with proper loading states and error messaging.

**Key considerations**: The authentication system should integrate seamlessly with PocketBase's built-in auth system. Implement proper token management with automatic refresh and secure storage. Provide clear user feedback for authentication states (loading, error, success). Design forms that are accessible and provide good user experience on both desktop and mobile devices.

**Expected outcome**: A complete authentication system with login, registration, and password reset functionality, integrated with PocketBase, and providing secure access control for the financial application.

#### Step 8: Build Dashboard and Data Components
**Purpose**: Create the core user interface components that display financial data, including file upload functionality, transaction tables, and dashboard summaries.

**What to implement**: Build a file upload component with drag-and-drop functionality that accepts CSV files and provides clear feedback on upload progress and results. Create a comprehensive dashboard component that displays key financial metrics like total income, expenses, savings rate, and trends. Implement a transaction table with filtering, sorting, and pagination capabilities. Design chart components for visualizing financial data trends and category breakdowns.

**Key considerations**: The file upload component should validate file types, show upload progress, and handle errors gracefully. The dashboard should provide at-a-glance insights into the user's financial health with clear visual hierarchy. Transaction tables should handle large datasets efficiently with virtualization if needed. Charts should be responsive and accessible with proper labels and legends.

**Expected outcome**: A functional financial dashboard with file upload, transaction management, and data visualization capabilities that provide users with comprehensive insights into their financial data.

#### Step 9: Integrate with Backend APIs
**Purpose**: Connect the frontend components to the backend FastAPI services and PocketBase for seamless data flow and real-time updates.

**What to implement**: Create an API service layer that handles all communication with the FastAPI backend for financial calculations and data processing. Implement PocketBase integration for authentication and real-time data updates. Set up error handling and loading states throughout the application. Create data fetching hooks that cache API responses and handle background updates. Implement optimistic updates for better user experience.

**Key considerations**: API integration should handle network errors gracefully with retry logic and user-friendly error messages. Implement proper loading states to provide feedback during data operations. Use TanStack Query for efficient data caching and background synchronization. Ensure that authentication tokens are properly included in API requests and handle token expiration gracefully.

**Expected outcome**: A fully integrated frontend application that communicates seamlessly with the backend services, providing real-time financial data updates with excellent user experience and proper error handling.

### Phase 3: Enhanced Features (Week 4-5)

The enhancement phase focuses on adding advanced features that improve the user experience and provide deeper financial insights. This phase builds upon the foundation to create a comprehensive financial management tool.

#### Step 10: Advanced Financial Visualizations
**Purpose**: Implement sophisticated data visualization components that help users understand their financial patterns and trends through interactive charts and graphs.

**What to implement**: Create multiple chart components including line charts for tracking savings rate over time, pie charts for expense category breakdowns, bar charts for monthly spending comparisons, and trend analysis visualizations for year-over-year comparisons. Implement interactive features like hover tooltips, clickable legend items, and zoom capabilities for detailed analysis.

**Key considerations**: Charts should be responsive and work well on both desktop and mobile devices. Use consistent color schemes that match the application's design system. Ensure accessibility with proper ARIA labels and keyboard navigation. Implement loading states for chart data and handle empty data states gracefully. Consider performance when rendering large datasets.

**Expected outcome**: A comprehensive set of financial visualization components that provide users with clear insights into their spending patterns, savings trends, and financial health over time.

#### Step 11: User Experience Improvements
**Purpose**: Enhance the overall user experience with advanced features that make financial data management more intuitive and efficient.

**What to implement**: Build a CSV import wizard that guides users through the file upload process with field mapping capabilities for different bank formats. Create transaction categorization rules that allow users to automatically categorize similar transactions. Implement export functionality for generating PDF reports and CSV downloads of analyzed data. Add dark mode support for better user experience in different lighting conditions. Create advanced filtering and search capabilities for transaction management.

**Key considerations**: The import wizard should be intuitive and handle various CSV formats from different banks. Categorization rules should be easy to set up and modify. Export features should generate professional-looking reports with proper formatting. Dark mode should be implemented consistently across all components with proper contrast ratios for accessibility.

**Expected outcome**: An enhanced user interface that provides professional-grade features for financial data management, making the application suitable for serious personal finance tracking and analysis.

#### Step 12: AI Integration Enhancement
**Purpose**: Leverage the existing FastMCP server to provide intelligent financial insights and recommendations through natural language interaction.

**What to implement**: Create a chat interface that connects to the existing FastMCP server for AI-powered financial analysis. Implement features that provide spending pattern analysis, budget recommendations, and personalized financial insights based on user data. Create natural language query capabilities that allow users to ask questions about their financial data and receive intelligent responses.

**Key considerations**: The AI integration should protect user privacy and ensure that financial data is processed securely. Design the chat interface to be intuitive and provide helpful responses even for complex financial questions. Implement proper error handling for AI service unavailability. Consider rate limiting and usage controls for AI features.

**Expected outcome**: An intelligent financial assistant that provides personalized insights and recommendations, enhancing the application's value proposition through AI-powered analysis and natural language interaction.

### Phase 4: Deployment and Infrastructure (Week 5-6)

The deployment phase focuses on creating a production-ready infrastructure that can scale and maintain the financial application reliably and securely.

#### Step 13: Containerization and Local Development
**Purpose**: Create a containerized development and deployment environment that ensures consistency across different environments and simplifies the deployment process.

**What to implement**: Design and implement Docker containers for the FastAPI backend with multi-stage builds for optimization. Create a comprehensive Docker Compose configuration for local development that includes all services (backend, PocketBase, frontend, and reverse proxy). Set up development environment scripts that automate the setup process. Configure proper networking between containers and volume management for persistent data.

**Key considerations**: Containers should be optimized for both development and production use. The development setup should include hot reloading and debugging capabilities. Ensure that data persists between container restarts and that the setup works consistently across different operating systems. Include proper health checks and dependency management between services.

**Expected outcome**: A fully containerized development environment that can be set up quickly on any machine, with all services properly configured and communicating, ready for both development and production deployment.

#### Step 14: Production Deployment Architecture
**Purpose**: Establish a robust production deployment strategy that balances cost, performance, and reliability for a personal finance application.

**What to implement**: Configure production deployment on Oracle Cloud Infrastructure (OCI) for the backend services with proper systemd service management. Set up frontend deployment on Vercel for global CDN distribution and automatic scaling. Implement a reverse proxy with Caddy for automatic HTTPS and request routing. Create backup strategies for user data and application state. Set up monitoring and logging for production health tracking.

**Key considerations**: The deployment should be cost-effective while providing good performance and reliability. Implement proper security measures including HTTPS, firewall configuration, and secure environment variable management. Ensure that backups are automated and tested regularly. Set up alerting for critical issues and performance monitoring.

**Expected outcome**: A production-ready deployment architecture that provides reliable service with automatic HTTPS, proper monitoring, and backup strategies, suitable for hosting a personal finance application with sensitive user data.

#### Step 15: CI/CD Pipeline and Automation
**Purpose**: Implement automated testing, building, and deployment processes that ensure code quality and enable reliable continuous deployment.

**What to implement**: Extend the existing GitHub Actions workflow to include comprehensive testing for both frontend and backend components. Add automated security scanning and dependency vulnerability checks. Implement automated deployment triggers for both staging and production environments. Create rollback procedures for failed deployments. Set up automated backup verification and disaster recovery procedures.

**Key considerations**: The CI/CD pipeline should catch issues before they reach production through comprehensive testing. Implement proper secret management for deployment credentials. Ensure that deployments can be rolled back quickly if issues are detected. Include performance testing and monitoring in the deployment process.

**Expected outcome**: A fully automated CI/CD pipeline that maintains code quality, automates deployments, and provides confidence in the release process through comprehensive testing and monitoring.

### Phase 5: Testing and Optimization (Week 6)

The final phase focuses on ensuring the application is robust, performant, and ready for real-world use through comprehensive testing and optimization.

#### Step 16: Comprehensive Testing Strategy
**Purpose**: Implement a thorough testing approach that covers all aspects of the application from unit tests to end-to-end user scenarios.

**What to implement**: Create comprehensive backend test suites covering API endpoints, data validation, authentication flows, and financial calculation accuracy. Implement frontend component testing with user interaction simulation and integration testing. Add end-to-end testing for critical user workflows like file upload, data analysis, and report generation. Create performance tests for handling large CSV files and multiple concurrent users.

**Key considerations**: Tests should cover both happy path scenarios and edge cases, especially for financial calculations where accuracy is critical. Implement proper test data management and isolation. Include accessibility testing to ensure the application is usable by all users. Set up automated test reporting and coverage tracking.

**Expected outcome**: A robust testing suite that provides confidence in the application's reliability and accuracy, with automated test execution and comprehensive coverage reporting.

#### Step 17: Performance Optimization and Scalability
**Purpose**: Optimize the application for performance, especially when handling large financial datasets, and prepare it for scaling to support multiple users.

**What to implement**: Implement performance optimizations for CSV processing including chunked file processing for large datasets. Add client-side performance improvements like virtual scrolling for large transaction tables, lazy loading for images and components, and efficient data caching strategies. Implement server-side optimizations including database query optimization, response caching, and rate limiting for API endpoints.

**Key considerations**: Financial data processing should remain fast and responsive even with large datasets. Focus on perceived performance through proper loading states and progressive data loading. Implement monitoring to track performance metrics and identify bottlenecks. Consider memory usage optimization for both client and server components.

**Expected outcome**: A highly optimized application that performs well with large financial datasets, provides responsive user experience, and is prepared for scaling to support multiple concurrent users.

## File Structure After Migration

The migration will result in a well-organized project structure that separates frontend and backend concerns while maintaining clear relationships between components:

**Backend Organization**: All server-side code will be organized in a backend directory including the core financial logic, API endpoints, database integration, tests, and configuration files. This structure supports easy deployment and maintenance.

**Frontend Organization**: The React application will be organized with clear separation of components, services, utilities, and types. This structure supports scalable development and easy testing.

**Infrastructure**: Deployment configurations, Docker setups, and CI/CD pipelines will be organized to support both local development and production deployment.

**Development Tools**: Testing, linting, and development scripts will be properly configured for both backend and frontend components.

## Key Benefits of This Stack

1. **Financial Focus**: Optimized specifically for CSV processing and financial analysis workflows with consideration for accuracy and data security
2. **User Privacy**: Self-hosted backend ensures sensitive financial data remains under user control with proper encryption and access controls
3. **AI Ready**: Integration with existing FastMCP server provides intelligent financial insights while maintaining data privacy
4. **Cost Effective**: Hybrid deployment strategy balances performance and cost while providing professional-grade capabilities
5. **Developer Experience**: Modern tooling and clear architecture enable efficient development and maintenance
6. **Scalable**: Architecture can grow from personal use to multi-user deployment without major restructuring
7. **Production Ready**: Comprehensive testing, monitoring, and deployment strategies ensure reliability
8. **Performance Optimized**: Designed to handle large financial datasets efficiently with responsive user experience

## Success Metrics

- **Performance**: CSV processing should handle 10,000+ transactions in under 2 seconds with optimized algorithms
- **User Experience**: Dashboard and visualizations should load in under 1 second with proper caching strategies
- **Reliability**: System should maintain 99.9% uptime with proper error handling and recovery mechanisms
- **Security**: All financial data should be encrypted at rest and in transit with secure authentication
- **AI Integration**: Natural language financial insights should provide valuable recommendations with sub-second response times
- **Scalability**: Architecture should support 100+ concurrent users without performance degradation

This migration plan provides a comprehensive roadmap for transforming the CLI tool into a professional-grade web application while maintaining the existing robust financial calculation engine and AI integration capabilities. Each phase builds upon the previous one, ensuring a smooth transition and professional result.