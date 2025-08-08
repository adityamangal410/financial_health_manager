#!/bin/bash

# Financial Health Manager - Application Management Script
# This script helps you easily start, stop, and manage the application stack

# Note: We handle errors explicitly rather than using set -e for better control

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
VENV_PATH="$PROJECT_ROOT/.venv"
POCKETBASE_DIR="$PROJECT_ROOT/pocketbase"
POCKETBASE_BASE_URL="https://github.com/pocketbase/pocketbase/releases/latest/download"

# PID files for process management
PIDS_DIR="$PROJECT_ROOT/.pids"
BACKEND_PID="$PIDS_DIR/backend.pid"
FRONTEND_PID="$PIDS_DIR/frontend.pid"
POCKETBASE_PID="$PIDS_DIR/pocketbase.pid"

# Log files
LOGS_DIR="$PROJECT_ROOT/logs"
BACKEND_LOG="$LOGS_DIR/backend.log"
FRONTEND_LOG="$LOGS_DIR/frontend.log"
POCKETBASE_LOG="$LOGS_DIR/pocketbase.log"

# Create necessary directories
mkdir -p "$PIDS_DIR" "$LOGS_DIR" "$POCKETBASE_DIR"

# Helper functions
print_header() {
    echo -e "${CYAN}===========================================${NC}"
    echo -e "${CYAN}  Financial Health Manager${NC}"
    echo -e "${CYAN}===========================================${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_section() {
    echo -e "\n${PURPLE}=== $1 ===${NC}"
}

# Check if a process is running
is_running() {
    local pid_file="$1"
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        else
            rm -f "$pid_file"
            return 1
        fi
    fi
    return 1
}

# Download PocketBase if not present
download_pocketbase() {
    local os_type=$(uname -s | tr '[:upper:]' '[:lower:]')
    local arch_type=$(uname -m)
    
    # Map architecture names
    case "$arch_type" in
        x86_64) arch_type="amd64" ;;
        arm64|aarch64) arch_type="arm64" ;;
        *) print_error "Unsupported architecture: $arch_type"; return 1 ;;
    esac
    
    # Map OS names
    case "$os_type" in
        darwin) os_type="darwin" ;;
        linux) os_type="linux" ;;
        *) print_error "Unsupported OS: $os_type"; return 1 ;;
    esac
    
    local pocketbase_binary="$POCKETBASE_DIR/pocketbase"
    
    if [[ ! -f "$pocketbase_binary" ]]; then
        print_status "Downloading PocketBase for $os_type-$arch_type..."
        
        # Get the actual download URL from GitHub API
        local api_url="https://api.github.com/repos/pocketbase/pocketbase/releases/latest"
        local download_url
        
        if command -v jq &> /dev/null; then
            download_url=$(curl -s "$api_url" | jq -r ".assets[] | select(.name | contains(\"${os_type}_${arch_type}\")) | .browser_download_url")
        else
            # Fallback without jq
            download_url=$(curl -s "$api_url" | grep "browser_download_url" | grep "${os_type}_${arch_type}" | head -1 | cut -d'"' -f4)
        fi
        
        if [[ -z "$download_url" || "$download_url" == "null" ]]; then
            print_error "Could not find PocketBase download for $os_type-$arch_type"
            return 1
        fi
        
        print_status "Downloading from: $download_url"
        
        if curl -L "$download_url" -o "$POCKETBASE_DIR/pocketbase.zip"; then
            if unzip -q "$POCKETBASE_DIR/pocketbase.zip" -d "$POCKETBASE_DIR"; then
                rm "$POCKETBASE_DIR/pocketbase.zip"
                chmod +x "$pocketbase_binary"
                print_success "PocketBase downloaded successfully"
            else
                print_error "Failed to extract PocketBase archive"
                rm -f "$POCKETBASE_DIR/pocketbase.zip"
                return 1
            fi
        else
            print_error "Failed to download PocketBase from $download_url"
            return 1
        fi
    fi
}

# Check prerequisites
check_prerequisites() {
    print_section "Checking Prerequisites"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not installed. Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ "$node_version" -lt 18 ]]; then
        print_error "Node.js 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    print_success "Node.js $(node --version) ✓"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3.10+ is required but not installed"
        exit 1
    fi
    print_success "Python $(python3 --version) ✓"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is required but not installed"
        exit 1
    fi
    print_success "npm $(npm --version) ✓"
    
    # Check for curl and unzip (for PocketBase download)
    for cmd in curl unzip; do
        if ! command -v "$cmd" &> /dev/null; then
            print_error "$cmd is required but not installed"
            exit 1
        fi
    done
    print_success "curl and unzip ✓"
}

# Setup Python virtual environment
setup_python_env() {
    print_section "Setting up Python Environment"
    
    if [[ ! -d "$VENV_PATH" ]]; then
        print_status "Creating Python virtual environment..."
        if ! python3 -m venv "$VENV_PATH"; then
            print_error "Failed to create virtual environment"
            return 1
        fi
        print_success "Virtual environment created"
    fi
    
    print_status "Activating virtual environment..."
    if [[ -f "$VENV_PATH/bin/activate" ]]; then
        source "$VENV_PATH/bin/activate"
        print_success "Virtual environment activated"
    else
        print_error "Virtual environment activation script not found"
        return 1
    fi
    
    # Ensure pip is available
    if ! command -v pip &> /dev/null; then
        print_status "Installing pip..."
        python3 -m ensurepip --upgrade || python3 -m ensurepip
    fi
    
    if [[ -f "$BACKEND_DIR/requirements.txt" ]]; then
        print_status "Installing Python dependencies..."
        # Filter out local editable installs that might cause issues
        if grep -v "^-e file://" "$BACKEND_DIR/requirements.txt" | python3 -m pip install -r /dev/stdin; then
            print_success "Python dependencies installed"
        else
            print_warning "Some Python dependencies may have failed to install"
            print_status "Continuing with available packages..."
        fi
    else
        print_warning "No requirements.txt found in backend directory"
    fi
}

# Setup Node.js environment
setup_node_env() {
    print_section "Setting up Node.js Environment"
    
    if [[ ! -d "$FRONTEND_DIR" ]]; then
        print_error "Frontend directory not found: $FRONTEND_DIR"
        return 1
    fi
    
    if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
        print_status "Installing Node.js dependencies..."
        cd "$FRONTEND_DIR"
        if npm install; then
            print_success "Node.js dependencies installed"
        else
            print_error "Failed to install Node.js dependencies"
            cd "$PROJECT_ROOT"
            return 1
        fi
        cd "$PROJECT_ROOT"
    else
        print_success "Node.js dependencies already installed"
    fi
}

# Start PocketBase
start_pocketbase() {
    if is_running "$POCKETBASE_PID"; then
        print_warning "PocketBase is already running (PID: $(cat $POCKETBASE_PID))"
        return 0
    fi
    
    download_pocketbase
    
    print_status "Starting PocketBase..."
    cd "$POCKETBASE_DIR"
    nohup ./pocketbase serve --http 0.0.0.0:8090 > "$POCKETBASE_LOG" 2>&1 &
    echo $! > "$POCKETBASE_PID"
    cd "$PROJECT_ROOT"
    
    # Wait for PocketBase to start
    sleep 2
    if is_running "$POCKETBASE_PID"; then
        print_success "PocketBase started (PID: $(cat $POCKETBASE_PID)) - http://localhost:8090"
    else
        print_error "Failed to start PocketBase"
        return 1
    fi
}

# Start FastAPI backend
start_backend() {
    if is_running "$BACKEND_PID"; then
        print_warning "Backend is already running (PID: $(cat $BACKEND_PID))"
        return 0
    fi
    
    # Check if uvicorn is available
    if ! command -v uvicorn &> /dev/null; then
        # Try to install uvicorn if not available
        print_status "Installing uvicorn..."
        source "$VENV_PATH/bin/activate"
        python3 -m pip install uvicorn fastapi > /dev/null 2>&1
    fi
    
    print_status "Starting FastAPI backend..."
    source "$VENV_PATH/bin/activate"
    cd "$BACKEND_DIR"
    
    # Check if server.py exists
    if [[ ! -f "server.py" ]]; then
        print_error "server.py not found in backend directory"
        cd "$PROJECT_ROOT"
        return 1
    fi
    
    nohup uvicorn server:app --reload --host 0.0.0.0 --port 8001 > "$BACKEND_LOG" 2>&1 &
    echo $! > "$BACKEND_PID"
    cd "$PROJECT_ROOT"
    
    # Wait for backend to start
    sleep 3
    if is_running "$BACKEND_PID"; then
        print_success "Backend started (PID: $(cat $BACKEND_PID)) - http://localhost:8001"
    else
        print_error "Failed to start backend"
        cat "$BACKEND_LOG" | tail -10  # Show recent logs for debugging
        return 1
    fi
}

# Start React frontend
start_frontend() {
    if is_running "$FRONTEND_PID"; then
        print_warning "Frontend is already running (PID: $(cat $FRONTEND_PID))"
        return 0
    fi
    
    print_status "Starting React frontend..."
    cd "$FRONTEND_DIR"
    
    # Create environment file if it doesn't exist
    if [[ ! -f ".env.local" ]]; then
        cat > .env.local << EOF
VITE_API_URL=http://localhost:8001
VITE_POCKETBASE_URL=http://localhost:8090
EOF
        print_status "Created .env.local with default configuration"
    fi
    
    nohup npm run dev > "$FRONTEND_LOG" 2>&1 &
    echo $! > "$FRONTEND_PID"
    cd "$PROJECT_ROOT"
    
    # Wait for frontend to start
    sleep 5
    if is_running "$FRONTEND_PID"; then
        print_success "Frontend started (PID: $(cat $FRONTEND_PID)) - http://localhost:3000"
    else
        print_error "Failed to start frontend"
        return 1
    fi
}

# Stop a service
stop_service() {
    local service_name="$1"
    local pid_file="$2"
    
    if is_running "$pid_file"; then
        local pid=$(cat "$pid_file")
        print_status "Stopping $service_name (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        
        # Wait for graceful shutdown
        for i in {1..10}; do
            if ! kill -0 "$pid" 2>/dev/null; then
                break
            fi
            sleep 1
        done
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            print_warning "Force killing $service_name..."
            kill -9 "$pid" 2>/dev/null || true
        fi
        
        rm -f "$pid_file"
        print_success "$service_name stopped"
    else
        print_warning "$service_name is not running"
    fi
}

# Show status of all services
show_status() {
    print_section "Service Status"
    
    echo -e "${YELLOW}Service${NC}        ${YELLOW}Status${NC}      ${YELLOW}PID${NC}     ${YELLOW}URL${NC}"
    echo "----------------------------------------"
    
    # PocketBase
    if is_running "$POCKETBASE_PID"; then
        echo -e "PocketBase     ${GREEN}Running${NC}     $(cat $POCKETBASE_PID)    http://localhost:8090"
    else
        echo -e "PocketBase     ${RED}Stopped${NC}     -       -"
    fi
    
    # Backend
    if is_running "$BACKEND_PID"; then
        echo -e "Backend        ${GREEN}Running${NC}     $(cat $BACKEND_PID)    http://localhost:8001"
    else
        echo -e "Backend        ${RED}Stopped${NC}     -       -"
    fi
    
    # Frontend
    if is_running "$FRONTEND_PID"; then
        echo -e "Frontend       ${GREEN}Running${NC}     $(cat $FRONTEND_PID)    http://localhost:3000"
    else
        echo -e "Frontend       ${RED}Stopped${NC}     -       -"
    fi
    
    echo ""
}

# Show logs
show_logs() {
    local service="$1"
    local follow="$2"
    
    case "$service" in
        "backend")
            if [[ "$follow" == "-f" ]]; then
                tail -f "$BACKEND_LOG"
            else
                tail -50 "$BACKEND_LOG"
            fi
            ;;
        "frontend")
            if [[ "$follow" == "-f" ]]; then
                tail -f "$FRONTEND_LOG"
            else
                tail -50 "$FRONTEND_LOG"
            fi
            ;;
        "pocketbase")
            if [[ "$follow" == "-f" ]]; then
                tail -f "$POCKETBASE_LOG"
            else
                tail -50 "$POCKETBASE_LOG"
            fi
            ;;
        "all")
            echo -e "${YELLOW}=== Backend Logs ===${NC}"
            tail -20 "$BACKEND_LOG" 2>/dev/null || echo "No backend logs"
            echo -e "\n${YELLOW}=== Frontend Logs ===${NC}"
            tail -20 "$FRONTEND_LOG" 2>/dev/null || echo "No frontend logs"
            echo -e "\n${YELLOW}=== PocketBase Logs ===${NC}"
            tail -20 "$POCKETBASE_LOG" 2>/dev/null || echo "No PocketBase logs"
            ;;
        *)
            print_error "Unknown service: $service"
            echo "Available services: backend, frontend, pocketbase, all"
            exit 1
            ;;
    esac
}

# Open application in browser
open_app() {
    local url="http://localhost:3000"
    
    if is_running "$FRONTEND_PID"; then
        print_status "Opening application in browser..."
        if command -v open &> /dev/null; then
            open "$url"  # macOS
        elif command -v xdg-open &> /dev/null; then
            xdg-open "$url"  # Linux
        elif command -v start &> /dev/null; then
            start "$url"  # Windows
        else
            print_warning "Could not open browser automatically"
            echo "Please open: $url"
        fi
    else
        print_error "Frontend is not running. Start it first with: $0 start"
        exit 1
    fi
}

# Reset application data
reset_data() {
    read -p "This will delete all application data. Are you sure? (y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping all services..."
        stop_service "Frontend" "$FRONTEND_PID"
        stop_service "Backend" "$BACKEND_PID"
        stop_service "PocketBase" "$POCKETBASE_PID"
        
        print_status "Clearing data..."
        rm -rf "$POCKETBASE_DIR/pb_data" 2>/dev/null || true
        rm -f "$LOGS_DIR"/*.log 2>/dev/null || true
        
        print_success "Application data reset complete"
    else
        print_status "Reset cancelled"
    fi
}

# Health check
health_check() {
    print_section "Health Check"
    
    local all_healthy=true
    
    # Check PocketBase
    if curl -s http://localhost:8090/api/health > /dev/null 2>&1; then
        print_success "PocketBase: Healthy"
    else
        print_error "PocketBase: Unhealthy or not running"
        all_healthy=false
    fi
    
    # Check Backend
    if curl -s http://localhost:8001/health > /dev/null 2>&1; then
        print_success "Backend: Healthy"
    else
        print_error "Backend: Unhealthy or not running"
        all_healthy=false
    fi
    
    # Check Frontend
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend: Healthy"
    else
        print_error "Frontend: Unhealthy or not running"
        all_healthy=false
    fi
    
    if $all_healthy; then
        print_success "All services are healthy!"
    else
        print_warning "Some services are not healthy. Check logs for details."
    fi
}

# Show usage
show_usage() {
    cat << EOF
Financial Health Manager - Application Management Script

Usage: $0 <command> [options]

Commands:
  setup               Set up the development environment
  start [service]     Start all services or a specific service
  stop [service]      Stop all services or a specific service
  restart [service]   Restart all services or a specific service
  status              Show status of all services
  logs <service> [-f] Show logs for a service (use -f to follow)
  open                Open the application in browser
  health              Check health of all services
  reset               Reset all application data (destructive)
  clean               Clean build artifacts and dependencies
  help                Show this help message

Services:
  all (default)       All services
  pocketbase          PocketBase database and auth
  backend             FastAPI backend server
  frontend            React frontend application

Examples:
  $0 setup                    # Set up development environment
  $0 start                    # Start all services
  $0 start frontend           # Start only frontend
  $0 stop                     # Stop all services
  $0 logs backend -f          # Follow backend logs
  $0 logs all                 # Show recent logs from all services
  $0 restart                  # Restart all services
  $0 health                   # Check service health
  $0 open                     # Open app in browser

URLs:
  Frontend:    http://localhost:3000
  Backend:     http://localhost:8001
  PocketBase:  http://localhost:8090/_/

EOF
}

# Main command processing
case "${1:-help}" in
    "setup")
        print_header
        check_prerequisites
        setup_python_env
        setup_node_env
        print_success "Setup complete! Run '$0 start' to start the application."
        ;;
        
    "start")
        print_header
        service="${2:-all}"
        
        case "$service" in
            "all")
                setup_python_env
                setup_node_env
                start_pocketbase
                start_backend
                start_frontend
                echo ""
                show_status
                print_success "Application started! Open http://localhost:3000 in your browser."
                ;;
            "pocketbase")
                start_pocketbase
                ;;
            "backend")
                setup_python_env
                start_backend
                ;;
            "frontend")
                setup_node_env
                start_frontend
                ;;
            *)
                print_error "Unknown service: $service"
                exit 1
                ;;
        esac
        ;;
        
    "stop")
        print_header
        service="${2:-all}"
        
        case "$service" in
            "all")
                stop_service "Frontend" "$FRONTEND_PID"
                stop_service "Backend" "$BACKEND_PID"
                stop_service "PocketBase" "$POCKETBASE_PID"
                ;;
            "pocketbase")
                stop_service "PocketBase" "$POCKETBASE_PID"
                ;;
            "backend")
                stop_service "Backend" "$BACKEND_PID"
                ;;
            "frontend")
                stop_service "Frontend" "$FRONTEND_PID"
                ;;
            *)
                print_error "Unknown service: $service"
                exit 1
                ;;
        esac
        ;;
        
    "restart")
        print_header
        service="${2:-all}"
        $0 stop "$service"
        sleep 2
        $0 start "$service"
        ;;
        
    "status")
        print_header
        show_status
        ;;
        
    "logs")
        if [[ -z "$2" ]]; then
            print_error "Please specify a service: backend, frontend, pocketbase, or all"
            exit 1
        fi
        show_logs "$2" "$3"
        ;;
        
    "open")
        open_app
        ;;
        
    "health")
        print_header
        health_check
        ;;
        
    "reset")
        print_header
        reset_data
        ;;
        
    "clean")
        print_header
        print_status "Cleaning build artifacts and dependencies..."
        rm -rf "$FRONTEND_DIR/node_modules" "$FRONTEND_DIR/dist"
        rm -rf "$VENV_PATH"
        rm -rf "$PIDS_DIR" "$LOGS_DIR"
        print_success "Clean complete"
        ;;
        
    "help"|"--help"|"-h")
        show_usage
        ;;
        
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac