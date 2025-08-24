#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🔍 Auto-detecting ports used by project...${NC}"

# Function to extract ports from package.json and config files
detect_ports() {
    local ports=()
    local port_descriptions=()
    
    # Check package.json for common port patterns
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        echo -e "${BLUE}   Scanning package.json...${NC}"
        # Look for port numbers in scripts
        while IFS= read -r line; do
            if [[ $line =~ :([0-9]{4,5}) ]]; then
                local port="${BASH_REMATCH[1]}"
                ports+=("$port")
                port_descriptions+=("Found in package.json")
            fi
        done < "$PROJECT_ROOT/package.json"
    fi
    
    # Check frontend package.json
    if [ -f "$PROJECT_ROOT/packages/frontend/package.json" ]; then
        echo -e "${BLUE}   Scanning frontend config...${NC}"
        # Look for dev server ports
        local frontend_port=$(grep -o '"dev".*port.*[0-9]\{4,5\}' "$PROJECT_ROOT/packages/frontend/package.json" | grep -o '[0-9]\{4,5\}' | head -1)
        if [ -n "$frontend_port" ]; then
            ports+=("$frontend_port")
            port_descriptions+=("Frontend dev server")
        fi
    fi
    
    # Check vite.config or similar files
    for config_file in "$PROJECT_ROOT/packages/frontend/vite.config."* "$PROJECT_ROOT/vite.config."*; do
        if [ -f "$config_file" ]; then
            echo -e "${BLUE}   Scanning $config_file...${NC}"
            local vite_port=$(grep -o 'port.*[0-9]\{4,5\}' "$config_file" | grep -o '[0-9]\{4,5\}' | head -1)
            if [ -n "$vite_port" ]; then
                ports+=("$vite_port")
                port_descriptions+=("Vite dev server")
            fi
        fi
    done
    
    # Check hardhat config
    for config_file in "$PROJECT_ROOT/packages/contracts/hardhat.config."* "$PROJECT_ROOT/hardhat.config."*; do
        if [ -f "$config_file" ]; then
            echo -e "${BLUE}   Scanning $config_file...${NC}"
            local hardhat_port=$(grep -o 'port.*[0-9]\{4,5\}' "$config_file" | grep -o '[0-9]\{4,5\}' | head -1)
            if [ -n "$hardhat_port" ]; then
                ports+=("$hardhat_port")
                port_descriptions+=("Hardhat node")
            fi
        fi
    done
    
    # Add common default ports if not found
    local common_ports=(8545 3000 3001 3002 5173)
    local common_names=("Hardhat" "Bundler/React" "Bundler Alt" "Frontend Alt" "Vite")
    
    for i in "${!common_ports[@]}"; do
        local port=${common_ports[$i]}
        local name=${common_names[$i]}
        
        # Check if port is actually in use
        if lsof -ti:$port >/dev/null 2>&1; then
            # Add if not already in list
            if [[ ! " ${ports[@]} " =~ " ${port} " ]]; then
                ports+=("$port")
                port_descriptions+=("$name (active)")
            fi
        fi
    done
    
    # Remove duplicates while preserving order
    local unique_ports=()
    local unique_descriptions=()
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        if [[ ! " ${unique_ports[@]} " =~ " ${port} " ]]; then
            unique_ports+=("$port")
            unique_descriptions+=("${port_descriptions[$i]}")
        fi
    done
    
    # Export results
    DETECTED_PORTS=("${unique_ports[@]}")
    PORT_DESCRIPTIONS=("${unique_descriptions[@]}")
}

kill_port() {
    local port=$1
    local description=$2
    
    # Find process using the port
    local pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}⚠️  Found process on port $port ($description): PID $pid${NC}"
        
        # Get process details
        local process_info=$(ps -p $pid -o pid,ppid,command --no-headers 2>/dev/null)
        if [ -n "$process_info" ]; then
            echo -e "${BLUE}   Process: $process_info${NC}"
        fi
        
        # Ask for confirmation if not in force mode
        if [ "$FORCE" != "true" ]; then
            read -p "Kill process on port $port? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${BLUE}   Skipping port $port${NC}"
                return
            fi
        fi
        
        # Try graceful termination first
        echo -e "${YELLOW}   Sending SIGTERM to PID $pid${NC}"
        kill $pid 2>/dev/null
        
        # Wait a moment for graceful shutdown
        sleep 2
        
        # Check if process still exists
        if kill -0 $pid 2>/dev/null; then
            echo -e "${RED}   Process still running, sending SIGKILL${NC}"
            kill -9 $pid 2>/dev/null
            sleep 1
        fi
        
        # Verify process is gone
        if ! kill -0 $pid 2>/dev/null; then
            echo -e "${GREEN}   ✅ Successfully killed process on port $port${NC}"
        else
            echo -e "${RED}   ❌ Failed to kill process on port $port${NC}"
        fi
    else
        echo -e "${GREEN}   ✅ Port $port ($description) is free${NC}"
    fi
}

# Parse command line arguments
FORCE=false
SCAN_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --force|-f)
            FORCE=true
            shift
            ;;
        --scan-only|-s)
            SCAN_ONLY=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --force, -f     Kill all processes without confirmation"
            echo "  --scan-only, -s Only scan and show occupied ports"
            echo "  --help, -h      Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

if [ "$FORCE" == "true" ]; then
    echo -e "${YELLOW}⚡ Force mode enabled - will kill all processes without confirmation${NC}"
fi

# Detect ports
detect_ports

if [ ${#DETECTED_PORTS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ No ports detected or all ports are free${NC}"
    exit 0
fi

echo -e "${BLUE}📋 Detected ports: ${DETECTED_PORTS[*]}${NC}"

if [ "$SCAN_ONLY" == "true" ]; then
    echo -e "\n${BLUE}📊 Port status (scan only):${NC}"
    for i in "${!DETECTED_PORTS[@]}"; do
        port=${DETECTED_PORTS[$i]}
        description="${PORT_DESCRIPTIONS[$i]}"
        pid=$(lsof -ti:$port 2>/dev/null)
        
        if [ -n "$pid" ]; then
            process_info=$(ps -p $pid -o command --no-headers 2>/dev/null)
            echo -e "${RED}   ❌ Port $port ($description): PID $pid - $process_info${NC}"
        else
            echo -e "${GREEN}   ✅ Port $port ($description): Free${NC}"
        fi
    done
    exit 0
fi

# Kill processes on detected ports
for i in "${!DETECTED_PORTS[@]}"; do
    kill_port ${DETECTED_PORTS[$i]} "${PORT_DESCRIPTIONS[$i]}"
done

echo -e "${BLUE}🏁 Port cleanup complete!${NC}"

# Show final status
echo -e "\n${BLUE}📊 Final port status:${NC}"
for i in "${!DETECTED_PORTS[@]}"; do
    port=${DETECTED_PORTS[$i]}
    description="${PORT_DESCRIPTIONS[$i]}"
    pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pid" ]; then
        echo -e "${RED}   ❌ Port $port ($description): Still occupied by PID $pid${NC}"
    else
        echo -e "${GREEN}   ✅ Port $port ($description): Free${NC}"
    fi
done