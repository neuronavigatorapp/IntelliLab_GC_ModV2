#!/usr/bin/env python3
"""
IntelliLab GC - Persistent Memory Manager
Ensures robust data persistence across all application layers
"""

import os
import json
import sqlite3
import pickle
import threading
import shutil
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PersistentMemoryManager:
    """
    Comprehensive persistent memory management for IntelliLab GC
    Handles multiple persistence layers:
    - SQLite database for structured data
    - JSON files for configuration
    - Binary files for large datasets
    - Session state management
    - Automatic backups
    """
    
    def __init__(self, base_path: str = None):
        """Initialize persistent memory manager"""
        self.base_path = Path(base_path or os.getcwd())
        self.data_dir = self.base_path / "data" / "persistent"
        self.backup_dir = self.base_path / "data" / "backups"
        self.config_dir = self.base_path / "data" / "config"
        self.cache_dir = self.base_path / "data" / "cache"
        
        # Create directories
        for directory in [self.data_dir, self.backup_dir, self.config_dir, self.cache_dir]:
            directory.mkdir(parents=True, exist_ok=True)
        
        # Database paths
        self.main_db = self.data_dir / "intellilab_main.db"
        self.session_db = self.data_dir / "intellilab_sessions.db"
        self.analytics_db = self.data_dir / "intellilab_analytics.db"
        
        # Configuration files
        self.user_settings = self.config_dir / "user_settings.json"
        self.app_state = self.config_dir / "app_state.json"
        self.instrument_configs = self.config_dir / "instruments.json"
        
        # Thread lock for safe concurrent access
        self.lock = threading.RLock()
        
        # Initialize databases and configurations
        self.initialize_persistent_storage()
        
        logger.info(f"Persistent Memory Manager initialized at: {self.base_path}")
    
    def initialize_persistent_storage(self):
        """Initialize all persistent storage components"""
        with self.lock:
            self._initialize_main_database()
            self._initialize_session_database()
            self._initialize_analytics_database()
            self._initialize_configuration_files()
            self._cleanup_old_data()
    
    def _initialize_main_database(self):
        """Initialize main SQLite database for core application data"""
        conn = sqlite3.connect(str(self.main_db))
        cursor = conn.cursor()
        
        # Instruments table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS instruments (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                manufacturer TEXT,
                model TEXT,
                serial_number TEXT UNIQUE,
                location TEXT,
                status TEXT DEFAULT 'active',
                config_json TEXT,
                last_maintenance DATE,
                total_runs INTEGER DEFAULT 0,
                total_runtime_hours REAL DEFAULT 0.0,
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Methods table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS methods (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                method_type TEXT NOT NULL,
                description TEXT,
                parameters_json TEXT,
                created_by TEXT,
                is_public BOOLEAN DEFAULT 0,
                usage_count INTEGER DEFAULT 0,
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Calculations history
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS calculations (
                id TEXT PRIMARY KEY,
                calculation_type TEXT NOT NULL,
                input_parameters TEXT,
                results_json TEXT,
                execution_time_ms INTEGER,
                user_id TEXT,
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Compounds library
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS compounds (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                molecular_formula TEXT,
                molecular_weight REAL,
                retention_time REAL,
                category TEXT,
                properties_json TEXT,
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Analysis runs
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analysis_runs (
                id TEXT PRIMARY KEY,
                instrument_id TEXT,
                method_id TEXT,
                sample_name TEXT,
                run_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                operator TEXT,
                conditions_json TEXT,
                results_json TEXT,
                peaks_json TEXT,
                status TEXT DEFAULT 'completed',
                notes TEXT,
                FOREIGN KEY (instrument_id) REFERENCES instruments (id),
                FOREIGN KEY (method_id) REFERENCES methods (id)
            )
        ''')
        
        # Create indexes for performance
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_instruments_serial ON instruments(serial_number)",
            "CREATE INDEX IF NOT EXISTS idx_methods_type ON methods(method_type)",
            "CREATE INDEX IF NOT EXISTS idx_calculations_type ON calculations(calculation_type)",
            "CREATE INDEX IF NOT EXISTS idx_calculations_date ON calculations(created_date)",
            "CREATE INDEX IF NOT EXISTS idx_compounds_name ON compounds(name)",
            "CREATE INDEX IF NOT EXISTS idx_runs_date ON analysis_runs(run_date)",
            "CREATE INDEX IF NOT EXISTS idx_runs_instrument ON analysis_runs(instrument_id)"
        ]
        
        for index_sql in indexes:
            cursor.execute(index_sql)
        
        conn.commit()
        conn.close()
        
        logger.info("Main database initialized successfully")
    
    def _initialize_session_database(self):
        """Initialize session database for user state management"""
        conn = sqlite3.connect(str(self.session_db))
        cursor = conn.cursor()
        
        # User sessions
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT,
                session_data TEXT,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Application state snapshots
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS app_state_snapshots (
                id TEXT PRIMARY KEY,
                state_type TEXT NOT NULL,
                state_data TEXT,
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Recent activities
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS recent_activities (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                activity_type TEXT NOT NULL,
                activity_data TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        
        logger.info("Session database initialized successfully")
    
    def _initialize_analytics_database(self):
        """Initialize analytics database for performance and usage tracking"""
        conn = sqlite3.connect(str(self.analytics_db))
        cursor = conn.cursor()
        
        # Performance metrics
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS performance_metrics (
                id TEXT PRIMARY KEY,
                metric_type TEXT NOT NULL,
                metric_name TEXT NOT NULL,
                metric_value REAL,
                unit TEXT,
                context_json TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Usage analytics
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS usage_analytics (
                id TEXT PRIMARY KEY,
                feature_name TEXT NOT NULL,
                action TEXT NOT NULL,
                user_id TEXT,
                duration_ms INTEGER,
                success BOOLEAN,
                error_message TEXT,
                metadata_json TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # System health checks
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS health_checks (
                id TEXT PRIMARY KEY,
                check_type TEXT NOT NULL,
                status TEXT NOT NULL,
                details_json TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        
        logger.info("Analytics database initialized successfully")
    
    def _initialize_configuration_files(self):
        """Initialize JSON configuration files with defaults"""
        
        # User settings defaults
        if not self.user_settings.exists():
            default_settings = {
                "ui_theme": "professional",
                "auto_save_interval": 30,
                "default_precision": 4,
                "chart_preferences": {
                    "default_chart_type": "line",
                    "show_gridlines": True,
                    "auto_scale": True
                },
                "calculation_preferences": {
                    "detection_limit_method": "3sigma",
                    "uncertainty_calculations": True,
                    "round_results": True
                },
                "backup_preferences": {
                    "auto_backup": True,
                    "backup_interval_hours": 24,
                    "keep_backups_days": 30
                }
            }
            self.save_json(self.user_settings, default_settings)
        
        # Application state defaults
        if not self.app_state.exists():
            default_app_state = {
                "last_opened_tool": None,
                "recent_calculations": [],
                "favorite_methods": [],
                "dashboard_layout": "default",
                "window_state": {
                    "maximized": False,
                    "width": 1200,
                    "height": 800,
                    "position": {"x": 100, "y": 100}
                },
                "active_instrument": None,
                "current_session": {
                    "started_at": None,
                    "total_calculations": 0,
                    "tools_used": []
                }
            }
            self.save_json(self.app_state, default_app_state)
        
        # Instruments configuration defaults
        if not self.instrument_configs.exists():
            default_instruments = {
                "instruments": [],
                "default_settings": {
                    "inlet_temperature": 250.0,
                    "split_ratio": 10.0,
                    "carrier_gas": "helium",
                    "flow_rate": 1.0,
                    "detector_temperature": 280.0
                },
                "calibration_schedules": {},
                "maintenance_schedules": {}
            }
            self.save_json(self.instrument_configs, default_instruments)
        
        logger.info("Configuration files initialized successfully")
    
    def _cleanup_old_data(self):
        """Clean up old session data and temporary files"""
        try:
            # Clean up expired sessions
            conn = sqlite3.connect(str(self.session_db))
            cursor = conn.cursor()
            
            # Remove sessions older than 30 days
            cleanup_date = datetime.now() - timedelta(days=30)
            cursor.execute(
                "DELETE FROM user_sessions WHERE created_date < ?",
                (cleanup_date.isoformat(),)
            )
            
            # Remove old app state snapshots (keep last 50)
            cursor.execute('''
                DELETE FROM app_state_snapshots 
                WHERE id NOT IN (
                    SELECT id FROM app_state_snapshots 
                    ORDER BY created_date DESC 
                    LIMIT 50
                )
            ''')
            
            conn.commit()
            conn.close()
            
            # Clean up old cache files
            if self.cache_dir.exists():
                for cache_file in self.cache_dir.glob("*.cache"):
                    if (datetime.now() - datetime.fromtimestamp(cache_file.stat().st_mtime)).days > 7:
                        cache_file.unlink()
            
            logger.info("Old data cleanup completed")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
    
    # === Core Data Persistence Methods ===
    
    def save_json(self, file_path: Path, data: Dict[str, Any]) -> bool:
        """Save data to JSON file with error handling"""
        try:
            with self.lock:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False, default=str)
                return True
        except Exception as e:
            logger.error(f"Error saving JSON to {file_path}: {e}")
            return False
    
    def load_json(self, file_path: Path, default: Dict[str, Any] = None) -> Dict[str, Any]:
        """Load data from JSON file with error handling"""
        try:
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                return default or {}
        except Exception as e:
            logger.error(f"Error loading JSON from {file_path}: {e}")
            return default or {}
    
    def save_binary(self, file_path: Path, data: Any) -> bool:
        """Save data to binary file using pickle"""
        try:
            with self.lock:
                with open(file_path, 'wb') as f:
                    pickle.dump(data, f)
                return True
        except Exception as e:
            logger.error(f"Error saving binary to {file_path}: {e}")
            return False
    
    def load_binary(self, file_path: Path, default: Any = None) -> Any:
        """Load data from binary file using pickle"""
        try:
            if file_path.exists():
                with open(file_path, 'rb') as f:
                    return pickle.load(f)
            else:
                return default
        except Exception as e:
            logger.error(f"Error loading binary from {file_path}: {e}")
            return default
    
    # === Database Operations ===
    
    def execute_db_query(self, db_path: Path, query: str, params: tuple = None, fetch: str = None) -> Any:
        """Execute database query with error handling"""
        try:
            with self.lock:
                conn = sqlite3.connect(str(db_path))
                conn.row_factory = sqlite3.Row  # Enable column access by name
                cursor = conn.cursor()
                
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                
                result = None
                if fetch == 'all':
                    result = cursor.fetchall()
                elif fetch == 'one':
                    result = cursor.fetchone()
                
                conn.commit()
                conn.close()
                return result
        except Exception as e:
            logger.error(f"Database query error: {e}")
            return None
    
    def save_instrument(self, instrument_data: Dict[str, Any]) -> bool:
        """Save instrument configuration to database"""
        query = '''
            INSERT OR REPLACE INTO instruments 
            (id, name, manufacturer, model, serial_number, location, status, config_json, modified_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''
        params = (
            instrument_data.get('id'),
            instrument_data.get('name'),
            instrument_data.get('manufacturer'),
            instrument_data.get('model'),
            instrument_data.get('serial_number'),
            instrument_data.get('location'),
            instrument_data.get('status', 'active'),
            json.dumps(instrument_data.get('config', {})),
            datetime.now().isoformat()
        )
        
        result = self.execute_db_query(self.main_db, query, params)
        return result is not None
    
    def get_instruments(self) -> List[Dict[str, Any]]:
        """Get all instruments from database"""
        query = "SELECT * FROM instruments ORDER BY name"
        result = self.execute_db_query(self.main_db, query, fetch='all')
        
        if result:
            instruments = []
            for row in result:
                instrument = dict(row)
                if instrument['config_json']:
                    instrument['config'] = json.loads(instrument['config_json'])
                instruments.append(instrument)
            return instruments
        return []
    
    def save_calculation_result(self, calculation_data: Dict[str, Any]) -> bool:
        """Save calculation result to database"""
        query = '''
            INSERT INTO calculations 
            (id, calculation_type, input_parameters, results_json, execution_time_ms, user_id)
            VALUES (?, ?, ?, ?, ?, ?)
        '''
        params = (
            calculation_data.get('id', str(datetime.now().timestamp())),
            calculation_data.get('type'),
            json.dumps(calculation_data.get('inputs', {})),
            json.dumps(calculation_data.get('results', {})),
            calculation_data.get('execution_time_ms', 0),
            calculation_data.get('user_id', 'anonymous')
        )
        
        result = self.execute_db_query(self.main_db, query, params)
        return result is not None
    
    def get_recent_calculations(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent calculations from database"""
        query = '''
            SELECT * FROM calculations 
            ORDER BY created_date DESC 
            LIMIT ?
        '''
        result = self.execute_db_query(self.main_db, query, (limit,), fetch='all')
        
        if result:
            calculations = []
            for row in result:
                calc = dict(row)
                if calc['input_parameters']:
                    calc['inputs'] = json.loads(calc['input_parameters'])
                if calc['results_json']:
                    calc['results'] = json.loads(calc['results_json'])
                calculations.append(calc)
            return calculations
        return []
    
    # === Session Management ===
    
    def save_session_state(self, session_id: str, session_data: Dict[str, Any]) -> bool:
        """Save current session state"""
        query = '''
            INSERT OR REPLACE INTO user_sessions 
            (session_id, user_id, session_data, last_activity, expires_at)
            VALUES (?, ?, ?, ?, ?)
        '''
        expires_at = datetime.now() + timedelta(hours=24)
        params = (
            session_id,
            session_data.get('user_id', 'anonymous'),
            json.dumps(session_data),
            datetime.now().isoformat(),
            expires_at.isoformat()
        )
        
        result = self.execute_db_query(self.session_db, query, params)
        return result is not None
    
    def load_session_state(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Load session state by ID"""
        query = '''
            SELECT session_data FROM user_sessions 
            WHERE session_id = ? AND expires_at > ?
        '''
        result = self.execute_db_query(
            self.session_db, 
            query, 
            (session_id, datetime.now().isoformat()), 
            fetch='one'
        )
        
        if result and result['session_data']:
            return json.loads(result['session_data'])
        return None
    
    # === Backup and Recovery ===
    
    def create_backup(self, backup_name: str = None) -> bool:
        """Create a complete backup of all persistent data"""
        try:
            if not backup_name:
                backup_name = f"intellilab_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            backup_path = self.backup_dir / backup_name
            backup_path.mkdir(exist_ok=True)
            
            # Backup databases
            for db_file in [self.main_db, self.session_db, self.analytics_db]:
                if db_file.exists():
                    shutil.copy2(db_file, backup_path / db_file.name)
            
            # Backup configuration files
            config_backup = backup_path / "config"
            config_backup.mkdir(exist_ok=True)
            
            for config_file in self.config_dir.glob("*.json"):
                shutil.copy2(config_file, config_backup / config_file.name)
            
            # Create backup manifest
            manifest = {
                "backup_name": backup_name,
                "created_at": datetime.now().isoformat(),
                "files_backed_up": len(list(backup_path.rglob("*"))),
                "size_mb": sum(f.stat().st_size for f in backup_path.rglob("*") if f.is_file()) / 1024 / 1024
            }
            
            with open(backup_path / "manifest.json", 'w') as f:
                json.dump(manifest, f, indent=2)
            
            logger.info(f"Backup created successfully: {backup_name}")
            return True
            
        except Exception as e:
            logger.error(f"Backup creation failed: {e}")
            return False
    
    def restore_backup(self, backup_name: str) -> bool:
        """Restore from backup"""
        try:
            backup_path = self.backup_dir / backup_name
            
            if not backup_path.exists():
                logger.error(f"Backup {backup_name} not found")
                return False
            
            # Restore databases
            for db_file in [self.main_db, self.session_db, self.analytics_db]:
                backup_db = backup_path / db_file.name
                if backup_db.exists():
                    shutil.copy2(backup_db, db_file)
            
            # Restore configuration files
            config_backup = backup_path / "config"
            if config_backup.exists():
                for config_file in config_backup.glob("*.json"):
                    shutil.copy2(config_file, self.config_dir / config_file.name)
            
            logger.info(f"Backup restored successfully: {backup_name}")
            return True
            
        except Exception as e:
            logger.error(f"Backup restoration failed: {e}")
            return False
    
    def list_backups(self) -> List[Dict[str, Any]]:
        """List all available backups"""
        backups = []
        
        for backup_dir in self.backup_dir.iterdir():
            if backup_dir.is_dir():
                manifest_file = backup_dir / "manifest.json"
                if manifest_file.exists():
                    try:
                        with open(manifest_file, 'r') as f:
                            manifest = json.load(f)
                        backups.append(manifest)
                    except Exception as e:
                        logger.error(f"Error reading backup manifest: {e}")
        
        return sorted(backups, key=lambda x: x['created_at'], reverse=True)
    
    # === Health and Monitoring ===
    
    def health_check(self) -> Dict[str, Any]:
        """Perform comprehensive health check of persistent storage"""
        health_status = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": "healthy",
            "components": {}
        }
        
        # Check database connectivity
        for db_name, db_path in [
            ("main", self.main_db),
            ("session", self.session_db),
            ("analytics", self.analytics_db)
        ]:
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                conn.close()
                health_status["components"][f"{db_name}_db"] = "healthy"
            except Exception as e:
                health_status["components"][f"{db_name}_db"] = f"error: {e}"
                health_status["overall_status"] = "degraded"
        
        # Check file system access
        for dir_name, dir_path in [
            ("data", self.data_dir),
            ("config", self.config_dir),
            ("backup", self.backup_dir),
            ("cache", self.cache_dir)
        ]:
            try:
                test_file = dir_path / f".health_check_{datetime.now().timestamp()}"
                test_file.touch()
                test_file.unlink()
                health_status["components"][f"{dir_name}_dir"] = "healthy"
            except Exception as e:
                health_status["components"][f"{dir_name}_dir"] = f"error: {e}"
                health_status["overall_status"] = "degraded"
        
        # Check disk space
        try:
            total, used, free = shutil.disk_usage(self.base_path)
            free_gb = free / (1024**3)
            health_status["disk_space_gb"] = {
                "total": total / (1024**3),
                "used": used / (1024**3),
                "free": free_gb
            }
            
            if free_gb < 1.0:  # Less than 1GB free
                health_status["components"]["disk_space"] = "warning: low disk space"
                health_status["overall_status"] = "warning"
            else:
                health_status["components"]["disk_space"] = "healthy"
        except Exception as e:
            health_status["components"]["disk_space"] = f"error: {e}"
        
        return health_status
    
    def get_storage_statistics(self) -> Dict[str, Any]:
        """Get detailed storage statistics"""
        stats = {
            "timestamp": datetime.now().isoformat(),
            "databases": {},
            "files": {},
            "total_size_mb": 0
        }
        
        # Database statistics
        for db_name, db_path in [
            ("main", self.main_db),
            ("session", self.session_db),
            ("analytics", self.analytics_db)
        ]:
            if db_path.exists():
                size_mb = db_path.stat().st_size / (1024 * 1024)
                stats["databases"][db_name] = {
                    "size_mb": round(size_mb, 2),
                    "path": str(db_path)
                }
                stats["total_size_mb"] += size_mb
        
        # Configuration files
        config_size = sum(f.stat().st_size for f in self.config_dir.glob("*.json")) / (1024 * 1024)
        stats["files"]["config"] = round(config_size, 2)
        stats["total_size_mb"] += config_size
        
        # Backup files
        if self.backup_dir.exists():
            backup_size = sum(f.stat().st_size for f in self.backup_dir.rglob("*") if f.is_file()) / (1024 * 1024)
            stats["files"]["backups"] = round(backup_size, 2)
            stats["total_size_mb"] += backup_size
        
        # Cache files
        if self.cache_dir.exists():
            cache_size = sum(f.stat().st_size for f in self.cache_dir.glob("*") if f.is_file()) / (1024 * 1024)
            stats["files"]["cache"] = round(cache_size, 2)
            stats["total_size_mb"] += cache_size
        
        stats["total_size_mb"] = round(stats["total_size_mb"], 2)
        
        return stats


# === Convenience Functions ===

def get_memory_manager(base_path: str = None) -> PersistentMemoryManager:
    """Get singleton instance of memory manager"""
    if not hasattr(get_memory_manager, '_instance'):
        get_memory_manager._instance = PersistentMemoryManager(base_path)
    return get_memory_manager._instance


def ensure_persistent_memory():
    """Quick function to ensure persistent memory is available"""
    manager = get_memory_manager()
    health = manager.health_check()
    
    if health["overall_status"] != "healthy":
        logger.warning(f"Persistent memory health check: {health['overall_status']}")
        for component, status in health["components"].items():
            if "error" in status or "warning" in status:
                logger.warning(f"  {component}: {status}")
    
    return health["overall_status"] == "healthy"


# === Demo and Testing Functions ===

def demo_persistent_memory():
    """Demonstrate persistent memory capabilities"""
    print("=== IntelliLab GC Persistent Memory Demo ===")
    
    manager = get_memory_manager()
    
    # Health check
    print("\n1. Health Check:")
    health = manager.health_check()
    print(f"   Overall Status: {health['overall_status']}")
    
    # Storage statistics
    print("\n2. Storage Statistics:")
    stats = manager.get_storage_statistics()
    print(f"   Total Storage: {stats['total_size_mb']:.2f} MB")
    print(f"   Databases: {len(stats['databases'])} files")
    
    # Save sample data
    print("\n3. Saving Sample Data:")
    
    # Sample instrument
    instrument = {
        "id": "demo_gc_001",
        "name": "Demo GC System",
        "manufacturer": "IntelliLab",
        "model": "Professional GC-2025",
        "serial_number": "IL-GC-DEMO-001",
        "location": "Demo Lab",
        "config": {
            "inlet_temp": 250.0,
            "detector_temp": 280.0,
            "carrier_gas": "helium"
        }
    }
    
    success = manager.save_instrument(instrument)
    print(f"   Instrument saved: {success}")
    
    # Sample calculation
    calculation = {
        "id": f"demo_calc_{datetime.now().timestamp()}",
        "type": "detection_limit",
        "inputs": {"signal": 1000, "noise": 10},
        "results": {"detection_limit": 30, "units": "ppm"},
        "execution_time_ms": 45
    }
    
    success = manager.save_calculation_result(calculation)
    print(f"   Calculation saved: {success}")
    
    # Create backup
    print("\n4. Creating Backup:")
    success = manager.create_backup("demo_backup")
    print(f"   Backup created: {success}")
    
    # List backups
    backups = manager.list_backups()
    print(f"   Available backups: {len(backups)}")
    
    print("\n=== Demo Complete ===")
    return True


if __name__ == "__main__":
    demo_persistent_memory()