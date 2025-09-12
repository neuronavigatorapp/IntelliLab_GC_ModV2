#!/usr/bin/env python3
"""
Branding service for IntelliLab GC
Handles white-label theme configurations
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from app.models.schemas import ThemeConfig, ThemeUpdate


class BrandingService:
    """Branding service for managing white-label themes"""
    
    def __init__(self):
        # In-memory storage for demo (replace with database in production)
        self.themes: Dict[int, ThemeConfig] = {}
        
        # Initialize with default theme
        self._initialize_default_theme()
    
    def _initialize_default_theme(self):
        """Initialize with default IntelliLab theme"""
        default_theme = ThemeConfig(
            id=1,
            org_id=None,  # Global default
            logo_url="/static/images/intellilab-logo.png",
            primary_color="#1d4ed8",
            accent_color="#3b82f6",
            secondary_color="#64748b",
            typography={
                "font_family": "Inter, system-ui, sans-serif",
                "font_size_base": "16px",
                "font_weight_normal": "400",
                "font_weight_bold": "600"
            },
            footer_links=[
                {"text": "About", "url": "/about"},
                {"text": "Support", "url": "/support"},
                {"text": "Privacy", "url": "/privacy"}
            ],
            company_name="IntelliLab GC",
            contact_email="support@intellilab.com",
            is_active=True,
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
        
        self.themes[1] = default_theme
    
    def get_theme(self, org_id: Optional[int] = None) -> ThemeConfig:
        """Get effective theme for organization (org-specific → global default)"""
        # First try to get org-specific theme
        if org_id:
            for theme in self.themes.values():
                if theme.org_id == org_id and theme.is_active:
                    return theme
        
        # Fall back to global default
        for theme in self.themes.values():
            if theme.org_id is None and theme.is_active:
                return theme
        
        # Return a minimal default if nothing is configured
        return ThemeConfig(
            id=0,
            org_id=None,
            logo_url="/static/images/intellilab-logo.png",
            primary_color="#1d4ed8",
            accent_color="#3b82f6",
            secondary_color="#64748b",
            typography={
                "font_family": "Inter, system-ui, sans-serif",
                "font_size_base": "16px",
                "font_weight_normal": "400",
                "font_weight_bold": "600"
            },
            footer_links=[],
            company_name="IntelliLab GC",
            contact_email="support@intellilab.com",
            is_active=True,
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
    
    def create_theme(self, org_id: int, theme_data: ThemeUpdate) -> ThemeConfig:
        """Create a new theme for an organization"""
        theme_id = max(self.themes.keys(), default=0) + 1
        
        theme = ThemeConfig(
            id=theme_id,
            org_id=org_id,
            logo_url=theme_data.logo_url,
            primary_color=theme_data.primary_color,
            accent_color=theme_data.accent_color,
            secondary_color=theme_data.secondary_color,
            typography=theme_data.typography,
            footer_links=theme_data.footer_links,
            company_name=theme_data.company_name,
            contact_email=theme_data.contact_email,
            is_active=True,
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
        
        self.themes[theme_id] = theme
        return theme
    
    def update_theme(self, org_id: int, theme_data: ThemeUpdate) -> Optional[ThemeConfig]:
        """Update theme for an organization"""
        # Find existing theme for this org
        existing_theme = None
        for theme in self.themes.values():
            if theme.org_id == org_id:
                existing_theme = theme
                break
        
        if existing_theme:
            # Update existing theme
            for field, value in theme_data.dict(exclude_unset=True).items():
                if hasattr(existing_theme, field) and value is not None:
                    setattr(existing_theme, field, value)
            
            existing_theme.updated_date = datetime.now()
            return existing_theme
        else:
            # Create new theme
            return self.create_theme(org_id, theme_data)
    
    def delete_theme(self, org_id: int) -> bool:
        """Delete theme for an organization (fall back to global default)"""
        theme_to_delete = None
        for theme in self.themes.values():
            if theme.org_id == org_id:
                theme_to_delete = theme
                break
        
        if theme_to_delete:
            del self.themes[theme_to_delete.id]
            return True
        
        return False
    
    def list_themes(self) -> List[ThemeConfig]:
        """List all themes"""
        return list(self.themes.values())
    
    def get_theme_css_vars(self, org_id: Optional[int] = None) -> Dict[str, str]:
        """Get CSS variables for theme"""
        theme = self.get_theme(org_id)
        
        css_vars = {
            "--primary-color": theme.primary_color or "#1d4ed8",
            "--accent-color": theme.accent_color or "#3b82f6",
            "--secondary-color": theme.secondary_color or "#64748b",
            "--font-family": theme.typography.get("font_family", "Inter, system-ui, sans-serif") if theme.typography else "Inter, system-ui, sans-serif",
            "--font-size-base": theme.typography.get("font_size_base", "16px") if theme.typography else "16px",
            "--font-weight-normal": theme.typography.get("font_weight_normal", "400") if theme.typography else "400",
            "--font-weight-bold": theme.typography.get("font_weight_bold", "600") if theme.typography else "600",
        }
        
        return css_vars
    
    def get_theme_metadata(self, org_id: Optional[int] = None) -> Dict[str, Any]:
        """Get theme metadata for frontend"""
        theme = self.get_theme(org_id)
        
        return {
            "logo_url": theme.logo_url,
            "company_name": theme.company_name,
            "contact_email": theme.contact_email,
            "footer_links": theme.footer_links or [],
            "primary_color": theme.primary_color,
            "accent_color": theme.accent_color,
            "secondary_color": theme.secondary_color,
            "typography": theme.typography or {}
        }
    
    def validate_color(self, color: str) -> bool:
        """Validate hex color format"""
        if not color:
            return False
        
        if not color.startswith('#'):
            return False
        
        if len(color) != 7:  # #RRGGBB
            return False
        
        try:
            int(color[1:], 16)
            return True
        except ValueError:
            return False
    
    def validate_theme_data(self, theme_data: ThemeUpdate) -> List[str]:
        """Validate theme data and return list of errors"""
        errors = []
        
        if theme_data.primary_color and not self.validate_color(theme_data.primary_color):
            errors.append("Invalid primary color format. Use #RRGGBB format.")
        
        if theme_data.accent_color and not self.validate_color(theme_data.accent_color):
            errors.append("Invalid accent color format. Use #RRGGBB format.")
        
        if theme_data.secondary_color and not self.validate_color(theme_data.secondary_color):
            errors.append("Invalid secondary color format. Use #RRGGBB format.")
        
        if theme_data.logo_url and not theme_data.logo_url.startswith(('http://', 'https://', '/')):
            errors.append("Logo URL must be a valid URL or absolute path.")
        
        if theme_data.contact_email and '@' not in theme_data.contact_email:
            errors.append("Contact email must be a valid email address.")
        
        return errors


# Global branding service instance
branding_service = BrandingService()
