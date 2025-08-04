# 🏗️ Job Sandbox Architecture

## 📋 Overview

Secure job execution architecture using Golang sandbox service, Cloudflare R2 storage, and Fly.io isolated containers.

## 🏛️ Architecture Components

### **1. Golang Sandbox Service**

**Location**: `sandbox-service/` (separate repository)

**Responsibilities**:

- Job execution orchestration
- Security validation and sanitization
- Resource limit enforcement
- Network access control
- Real-time log streaming
- Container lifecycle management

**Key Features**:

```go
type JobExecution struct {
    ID          string            `json:"id"`
    Command     string            `json:"command"`
    Environment map[string]string `json:"environment"`
    Timeout     int               `json:"timeout"`
    Resources   ResourceLimits    `json:"resources"`
    Network     NetworkPolicy     `json:"network"`
    Files       []JobFile         `json:"files"`
}

type ResourceLimits struct {
    CPU    string `json:"cpu"`    // e.g., "0.5" (50% of CPU)
    Memory string `json:"memory"` // e.g., "512Mi"
    Disk   string `json:"disk"`   // e.g., "1Gi"
}

type NetworkPolicy struct {
    AllowedHosts []string `json:"allowed_hosts"`
    BlockedPorts []int    `json:"blocked_ports"`
    Outbound     bool     `json:"outbound"` // Allow outbound connections
}
```

### **2. Cloudflare R2 Storage**

**Purpose**: Secure file storage for job artifacts

**Storage Structure**:

```
r2://chronos-synapse/
├── jobs/
│   ├── {job-id}/
│   │   ├── input/          # Job input files
│   │   ├── output/         # Job output files
│   │   ├── logs/           # Job execution logs
│   │   └── artifacts/      # Generated artifacts
├── templates/              # Job templates
└── shared/                 # Shared resources
```

**Security Features**:

- Signed URLs for secure access
- Automatic file expiration
- Access logging and audit trails
- Encryption at rest and in transit

### **3. Fly.io Isolated Containers**

**Purpose**: Secure, ephemeral execution environment

**Container Features**:

- Ephemeral containers per job execution
- Resource isolation (CPU, memory, disk)
- Network isolation with controlled access
- Automatic cleanup after job completion
- Base images with minimal attack surface

**Container Lifecycle**:

1. **Create**: Spin up isolated container
2. **Prepare**: Mount files, set environment
3. **Execute**: Run job with monitoring
4. **Collect**: Gather outputs and logs
5. **Cleanup**: Destroy container and resources

## 🔄 Execution Flow

### **1. Job Submission**

```
Node.js API → Redis Queue → Golang Service
```

### **2. Job Preparation**

```
Golang Service → Cloudflare R2 → Download files
Golang Service → Fly.io → Create container
```

### **3. Job Execution**

```
Fly.io Container → Execute command → Stream logs
Golang Service → Monitor execution → Enforce limits
```

### **4. Job Completion**

```
Fly.io Container → Upload results → Cloudflare R2
Golang Service → Update status → Node.js API
```

## 🛡️ Security Features

### **1. Command Validation**

- Whitelist allowed commands
- Block dangerous operations
- Sanitize user inputs
- Prevent privilege escalation

### **2. Resource Isolation**

- CPU limits per job
- Memory limits per job
- Disk space restrictions
- Network bandwidth limits

### **3. Network Security**

- Controlled outbound access
- Blocked dangerous ports
- Allowed hosts whitelist
- No inbound connections

### **4. File System Security**

- Read-only base filesystem
- Temporary writable directories
- Automatic cleanup
- No access to host filesystem

## 📊 Monitoring & Logging

### **1. Real-time Monitoring**

- Resource usage tracking
- Execution time monitoring
- Network activity logging
- Security event detection

### **2. Log Management**

- Structured JSON logging
- Real-time log streaming
- Log aggregation and search
- Retention policies

### **3. Metrics Collection**

- Job success/failure rates
- Resource utilization
- Security incidents
- Performance metrics

## 🚀 Implementation Plan

### **Phase 1: Golang Service Foundation**

- [ ] Basic Golang service structure
- [ ] Job execution interface
- [ ] Redis queue integration
- [ ] Basic security validation

### **Phase 2: Cloudflare R2 Integration**

- [ ] File upload/download
- [ ] Signed URL generation
- [ ] File lifecycle management
- [ ] Security policies

### **Phase 3: Fly.io Container Management**

- [ ] Container creation/destruction
- [ ] Resource limit enforcement
- [ ] Network isolation
- [ ] File system mounting

### **Phase 4: Security Hardening**

- [ ] Command validation
- [ ] Resource monitoring
- [ ] Security event detection
- [ ] Audit logging

### **Phase 5: Integration & Testing**

- [ ] Node.js API integration
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security testing

## 🔧 Configuration

### **Environment Variables**

```bash
# Golang Service
SANDBOX_REDIS_URL=redis://localhost:6379
SANDBOX_CLOUDFLARE_ACCOUNT_ID=your_account_id
SANDBOX_CLOUDFLARE_ACCESS_KEY=your_access_key
SANDBOX_CLOUDFLARE_SECRET_KEY=your_secret_key
SANDBOX_FLY_API_TOKEN=your_fly_token

# Resource Limits
SANDBOX_DEFAULT_CPU=0.5
SANDBOX_DEFAULT_MEMORY=512Mi
SANDBOX_DEFAULT_DISK=1Gi
SANDBOX_DEFAULT_TIMEOUT=300

# Security
SANDBOX_ALLOWED_COMMANDS=ls,cat,grep,curl,wget
SANDBOX_BLOCKED_PORTS=22,25,3306,5432
SANDBOX_ALLOWED_HOSTS=api.github.com,registry.npmjs.org
```

## 📈 Benefits

### **1. Security**

- Complete job isolation
- Resource limit enforcement
- Network access control
- Automatic cleanup

### **2. Scalability**

- Horizontal scaling with Fly.io
- Distributed execution
- Load balancing
- Auto-scaling

### **3. Reliability**

- Fault tolerance
- Automatic retries
- Health monitoring
- Disaster recovery

### **4. Cost Efficiency**

- Pay-per-use pricing
- Resource optimization
- Automatic cleanup
- No idle resources

## 🎯 Next Steps

1. **Set up Golang development environment**
2. **Create Cloudflare R2 bucket and configure access**
3. **Set up Fly.io account and API access**
4. **Implement basic Golang service**
5. **Integrate with existing Node.js API**

This architecture provides enterprise-grade security and scalability for job execution while maintaining cost efficiency and ease of management.
