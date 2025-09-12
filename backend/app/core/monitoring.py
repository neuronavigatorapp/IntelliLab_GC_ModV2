#!/usr/bin/env python3
"""
Monitoring and error tracking for IntelliLab GC API
"""

import os
import logging
import traceback
from typing import Optional, Dict, Any

# Initialize logger
logger = logging.getLogger(__name__)

# Sentry SDK (optional dependency)
try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration
    SENTRY_AVAILABLE = True
except ImportError:
    logger.warning("Sentry SDK not available. Error tracking will use local logging only.")
    SENTRY_AVAILABLE = False

def init_monitoring():
    """Initialize Sentry error tracking and monitoring"""
    environment = os.getenv("ENVIRONMENT", "development")
    sentry_dsn = os.getenv("SENTRY_DSN")
    
    if SENTRY_AVAILABLE and sentry_dsn and environment == "production":
        try:
            # Configure logging integration
            logging_integration = LoggingIntegration(
                level=logging.INFO,        # Capture info and above as breadcrumbs
                event_level=logging.ERROR  # Send errors as events
            )
            
            sentry_sdk.init(
                dsn=sentry_dsn,
                integrations=[
                    FastApiIntegration(transaction_style="endpoint"),
                    SqlalchemyIntegration(),
                    logging_integration,
                ],
                traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
                environment=environment,
                release=os.getenv("APP_VERSION", "1.0.0"),
                before_send=filter_errors,
            )
            logger.info("Sentry monitoring initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Sentry: {e}")
    else:
        logger.info("Sentry monitoring disabled (development mode or no DSN provided)")

def filter_errors(event, hint):
    """Filter out non-critical errors from being sent to Sentry"""
    if 'exc_info' in hint:
        exc_type, exc_value, tb = hint['exc_info']
        
        # Don't send validation errors
        if 'ValidationError' in str(exc_type):
            return None
            
        # Don't send connection timeouts in development
        if 'TimeoutError' in str(exc_type) and os.getenv("ENVIRONMENT") == "development":
            return None
            
        # Don't send 404 errors
        if hasattr(exc_value, 'status_code') and exc_value.status_code == 404:
            return None
    
    return event

def log_error(error: Exception, context: Optional[Dict[str, Any]] = None, user_id: Optional[str] = None):
    """
    Log error with context information
    
    Args:
        error: The exception that occurred
        context: Additional context information
        user_id: User ID if available
    """
    error_info = {
        'error_type': type(error).__name__,
        'error_message': str(error),
        'traceback': traceback.format_exc(),
        'context': context or {},
        'user_id': user_id,
    }
    
    # Log locally
    logger.error(f"Application error: {error_info}")
    
    # Send to Sentry if available and in production
    if SENTRY_AVAILABLE and os.getenv("ENVIRONMENT") == "production":
        with sentry_sdk.configure_scope() as scope:
            if user_id:
                scope.user = {"id": user_id}
            if context:
                for key, value in context.items():
                    scope.set_extra(key, value)
            
            sentry_sdk.capture_exception(error)

def log_performance_metric(operation: str, duration: float, context: Optional[Dict[str, Any]] = None):
    """
    Log performance metrics for monitoring
    
    Args:
        operation: Name of the operation
        duration: Duration in seconds
        context: Additional context
    """
    metric_info = {
        'operation': operation,
        'duration_seconds': duration,
        'context': context or {}
    }
    
    logger.info(f"Performance metric: {metric_info}")
    
    # Send to Sentry if available
    if SENTRY_AVAILABLE:
        with sentry_sdk.configure_scope() as scope:
            scope.set_tag("operation", operation)
            if context:
                for key, value in context.items():
                    scope.set_extra(key, value)
            
            # Create a custom transaction for performance monitoring
            with sentry_sdk.start_transaction(op="performance", name=operation) as transaction:
                transaction.set_measurement("duration", duration, "second")

def log_user_action(action: str, user_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
    """
    Log user actions for analytics and debugging
    
    Args:
        action: The action performed
        user_id: User ID if available
        details: Additional action details
    """
    action_info = {
        'action': action,
        'user_id': user_id,
        'details': details or {}
    }
    
    logger.info(f"User action: {action_info}")
    
    # Add breadcrumb to Sentry if available
    if SENTRY_AVAILABLE:
        sentry_sdk.add_breadcrumb(
            message=action,
            category='user_action',
            data=action_info,
            level='info'
        )

def set_user_context(user_id: str, email: Optional[str] = None, role: Optional[str] = None):
    """
    Set user context for error tracking
    
    Args:
        user_id: User ID
        email: User email
        role: User role
    """
    if SENTRY_AVAILABLE:
        with sentry_sdk.configure_scope() as scope:
            scope.user = {
                "id": user_id,
                "email": email,
                "role": role
            }

class ErrorTracker:
    """Context manager for tracking errors in code blocks"""
    
    def __init__(self, operation: str, context: Optional[Dict[str, Any]] = None):
        self.operation = operation
        self.context = context or {}
        self.start_time = None
    
    def __enter__(self):
        import time
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        import time
        duration = time.time() - self.start_time if self.start_time else 0
        
        if exc_type is not None:
            # An error occurred
            log_error(exc_val, {**self.context, 'operation': self.operation})
        else:
            # Operation completed successfully
            log_performance_metric(self.operation, duration, self.context)
        
        return False  # Don't suppress exceptions
