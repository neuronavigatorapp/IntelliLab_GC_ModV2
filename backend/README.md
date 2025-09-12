# IntelliLab GC - FastAPI Backend

Professional GC instrumentation API for scientific calculations and instrument management.

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Run the development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📁 Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── app/
│   ├── __init__.py
│   ├── core/              # Core configuration and utilities
│   │   ├── __init__.py
│   │   ├── config.py      # Application settings
│   │   ├── database.py    # Database models and configuration
│   │   └── websocket.py   # WebSocket manager
│   ├── api/               # API endpoints
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── api.py     # Main API router
│   │       └── endpoints/ # API endpoint modules
│   │           ├── __init__.py
│   │           ├── instruments.py    # Instrument management
│   │           ├── calculations.py   # Scientific calculations
│   │           └── files.py         # File upload/download
│   ├── models/            # Pydantic schemas
│   │   ├── __init__.py
│   │   └── schemas.py     # Data validation models
│   └── services/          # Business logic
│       ├── __init__.py
│       └── inlet_simulator.py  # GC inlet simulation service
├── uploads/               # File upload directory
└── logs/                  # Application logs
```

## 🔧 Features

### Core Functionality

- **Instrument Management**: CRUD operations for GC instrument profiles
- **Scientific Calculations**: 
  - GC Inlet Simulator
  - Detection Limit Calculator
  - Oven Ramp Visualizer
- **File Management**: Upload/download with validation
- **Real-time Updates**: WebSocket support for live data
- **Database Integration**: SQLite with SQLAlchemy ORM
- **API Documentation**: Auto-generated Swagger/OpenAPI docs

### API Endpoints

#### Instruments
- `GET /api/v1/instruments/` - List all instruments
- `GET /api/v1/instruments/{id}` - Get instrument by ID
- `POST /api/v1/instruments/` - Create new instrument
- `PUT /api/v1/instruments/{id}` - Update instrument
- `DELETE /api/v1/instruments/{id}` - Delete instrument
- `GET /api/v1/instruments/{id}/performance` - Get performance metrics
- `GET /api/v1/instruments/fleet/overview` - Fleet overview

#### Calculations
- `POST /api/v1/calculations/inlet-simulator` - Inlet simulation
- `POST /api/v1/calculations/detection-limit` - Detection limit calculation
- `POST /api/v1/calculations/oven-ramp` - Oven ramp calculation
- `GET /api/v1/calculations/history` - Calculation history

#### Files
- `POST /api/v1/files/upload` - Upload file
- `GET /api/v1/files/download/{id}` - Download file
- `GET /api/v1/files/` - List files
- `DELETE /api/v1/files/{id}` - Delete file
- `POST /api/v1/files/export/method` - Export method data
- `POST /api/v1/files/import/method` - Import method data
- `GET /api/v1/files/stats` - File statistics

#### WebSocket
- `WS /ws` - Real-time updates

## 🗄️ Database Schema

### Instruments Table
- `id` (Primary Key)
- `name` - Instrument name
- `model` - Instrument model
- `serial_number` - Unique serial number
- `age_years` - Instrument age
- `maintenance_level` - Maintenance status
- `vacuum_integrity` - Vacuum system integrity
- `septum_condition` - Septum condition
- `liner_condition` - Liner condition
- `parameters` (JSON) - Additional parameters
- `calibration_data` (JSON) - Calibration data
- `performance_history` (JSON) - Performance metrics
- `created_date` - Creation timestamp
- `modified_date` - Last modification timestamp

### Calculations Table
- `id` (Primary Key)
- `calculation_type` - Type of calculation
- `input_parameters` (JSON) - Input parameters
- `output_results` (JSON) - Calculation results
- `execution_time` - Calculation duration
- `created_date` - Calculation timestamp

### File Uploads Table
- `id` (Primary Key)
- `filename` - Unique filename
- `original_filename` - Original filename
- `file_path` - File storage path
- `file_size` - File size in bytes
- `file_type` - MIME type
- `upload_date` - Upload timestamp

## 🔬 Scientific Calculations

### Inlet Simulator
- Transfer efficiency calculation
- Discrimination factor analysis
- Peak shape optimization
- Real-world instrument degradation factors
- Performance recommendations

### Detection Limit Calculator
- Signal-to-noise ratio calculation
- ASTM compliance checking
- Detector-specific optimizations
- Carrier gas effects
- Flow rate optimization

### Oven Ramp Visualizer
- Temperature profile calculation
- Chromatogram simulation
- Resolution and efficiency scoring
- Heating rate compliance
- Optimization recommendations

## 🌐 WebSocket Events

### Calculation Updates
```json
{
  "type": "calculation_update",
  "calculation_type": "inlet_simulation",
  "results": {...},
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Parameter Changes
```json
{
  "type": "parameter_change",
  "tool": "inlet_simulator",
  "parameters": {...},
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Instrument Updates
```json
{
  "type": "instrument_update",
  "instrument_id": 1,
  "action": "create",
  "data": {...},
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL` - Database connection string
- `SECRET_KEY` - Application secret key
- `ALLOWED_ORIGINS` - CORS allowed origins
- `UPLOAD_DIR` - File upload directory
- `MAX_FILE_SIZE` - Maximum file size (bytes)

### Settings
- CORS configuration for frontend integration
- File upload size limits
- Database connection settings
- Logging configuration
- WebSocket settings

## 🚀 Deployment

### Development
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production
```bash
# Using Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Using Docker
docker build -t intellilab-gc-api .
docker run -p 8000:8000 intellilab-gc-api
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:8000/health
```

### Logs
- Application logs: `logs/intellilab_gc.log`
- Log level: INFO
- Structured logging with loguru

### Metrics
- Calculation execution times
- API response times
- Database query performance
- File upload statistics

## 🔒 Security

- Input validation with Pydantic
- File type validation
- Size limits on uploads
- CORS configuration
- Error handling and logging
- Database connection security

## 🤝 Integration

### Frontend Integration
- CORS configured for React/Vue.js
- WebSocket support for real-time updates
- File upload/download endpoints
- JSON API responses

### External Systems
- Database: SQLite (can be migrated to PostgreSQL)
- File Storage: Local filesystem
- Real-time: WebSocket connections
- Documentation: OpenAPI/Swagger

## 📈 Performance

### Optimization Features
- Async/await for I/O operations
- Database connection pooling
- File streaming for large uploads
- Caching for repeated calculations
- Background task processing

### Scalability
- Stateless API design
- Database connection management
- File storage abstraction
- Modular service architecture
- Horizontal scaling ready

## 🐛 Troubleshooting

### Common Issues
1. **Database Connection**: Check `DATABASE_URL` in settings
2. **File Uploads**: Verify `UPLOAD_DIR` exists and is writable
3. **CORS Errors**: Check `ALLOWED_ORIGINS` configuration
4. **WebSocket Issues**: Verify WebSocket endpoint and client connection

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
uvicorn main:app --reload --log-level debug
```

## 📚 API Examples

### Create Instrument
```bash
curl -X POST "http://localhost:8000/api/v1/instruments/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GC-2010 Plus",
    "model": "Shimadzu GC-2010 Plus",
    "serial_number": "GC2010P001",
    "age_years": 5.0,
    "maintenance_level": "Good",
    "vacuum_integrity": 95.0
  }'
```

### Inlet Simulation
```bash
curl -X POST "http://localhost:8000/api/v1/calculations/inlet-simulator" \
  -H "Content-Type: application/json" \
  -d '{
    "inlet_temp": 250.0,
    "split_ratio": 20.0,
    "injection_volume": 1.0,
    "instrument_age": 5.0,
    "maintenance_level": "Good"
  }'
```

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## 🎯 Future Enhancements

- PostgreSQL migration
- Redis caching
- Authentication/Authorization
- Rate limiting
- Background task queue
- Docker containerization
- Kubernetes deployment
- Monitoring and alerting
- API versioning
- GraphQL support 