#!/usr/bin/env python3
"""
Branding endpoints for IntelliLab GC API
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from app.models.schemas import ThemeConfig, ThemeUpdate
from app.services.branding_service import branding_service

router = APIRouter()


@router.get("/theme", response_model=ThemeConfig)
async def get_theme(
    org_id: Optional[int] = Query(None, description="Organization ID")
):
    """Get effective theme for organization"""
    theme = branding_service.get_theme(org_id)
    return theme


@router.post("/theme", response_model=ThemeConfig)
async def create_theme(
    theme_data: ThemeUpdate,
    org_id: int = Query(..., description="Organization ID")
):
    """Create a new theme for an organization"""
    # Validate theme data
    errors = branding_service.validate_theme_data(theme_data)
    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})
    
    try:
        theme = branding_service.create_theme(org_id, theme_data)
        return theme
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/theme", response_model=ThemeConfig)
async def update_theme(
    theme_data: ThemeUpdate,
    org_id: int = Query(..., description="Organization ID")
):
    """Update theme for an organization"""
    # Validate theme data
    errors = branding_service.validate_theme_data(theme_data)
    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})
    
    try:
        theme = branding_service.update_theme(org_id, theme_data)
        return theme
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/theme")
async def delete_theme(
    org_id: int = Query(..., description="Organization ID")
):
    """Delete theme for an organization (fall back to global default)"""
    success = branding_service.delete_theme(org_id)
    if not success:
        raise HTTPException(status_code=404, detail="Theme not found")
    
    return {"status": "deleted", "org_id": org_id}


@router.get("/themes", response_model=List[ThemeConfig])
async def list_themes():
    """List all themes"""
    themes = branding_service.list_themes()
    return themes


@router.get("/theme/css-vars")
async def get_theme_css_vars(
    org_id: Optional[int] = Query(None, description="Organization ID")
):
    """Get CSS variables for theme"""
    css_vars = branding_service.get_theme_css_vars(org_id)
    return css_vars


@router.get("/theme/metadata")
async def get_theme_metadata(
    org_id: Optional[int] = Query(None, description="Organization ID")
):
    """Get theme metadata for frontend"""
    metadata = branding_service.get_theme_metadata(org_id)
    return metadata


@router.get("/theme/preview")
async def preview_theme(
    theme_data: ThemeUpdate,
    org_id: Optional[int] = Query(None, description="Organization ID")
):
    """Preview theme changes without saving"""
    # Validate theme data
    errors = branding_service.validate_theme_data(theme_data)
    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})
    
    # Create temporary theme for preview
    temp_theme = ThemeConfig(
        id=0,
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
        created_date=branding_service._get_current_time(),
        updated_date=branding_service._get_current_time()
    )
    
    return {
        "preview": True,
        "theme": temp_theme,
        "css_vars": branding_service.get_theme_css_vars_from_theme(temp_theme),
        "metadata": branding_service.get_theme_metadata_from_theme(temp_theme)
    }


@router.get("/theme/validate")
async def validate_theme_data(theme_data: ThemeUpdate):
    """Validate theme data"""
    errors = branding_service.validate_theme_data(theme_data)
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }


@router.get("/theme/default")
async def get_default_theme():
    """Get the default theme configuration"""
    default_theme = branding_service.get_theme(None)  # Get global default
    return default_theme


@router.post("/theme/reset")
async def reset_theme(
    org_id: int = Query(..., description="Organization ID")
):
    """Reset theme to default for an organization"""
    success = branding_service.delete_theme(org_id)
    return {
        "status": "reset",
        "org_id": org_id,
        "message": "Theme reset to default"
    }


@router.get("/theme/export")
async def export_theme(
    org_id: int = Query(..., description="Organization ID")
):
    """Export theme configuration"""
    theme = branding_service.get_theme(org_id)
    
    export_data = {
        "org_id": org_id,
        "theme": {
            "logo_url": theme.logo_url,
            "primary_color": theme.primary_color,
            "accent_color": theme.accent_color,
            "secondary_color": theme.secondary_color,
            "typography": theme.typography,
            "footer_links": theme.footer_links,
            "company_name": theme.company_name,
            "contact_email": theme.contact_email
        },
        "css_vars": branding_service.get_theme_css_vars(org_id),
        "metadata": branding_service.get_theme_metadata(org_id),
        "export_date": branding_service._get_current_time()
    }
    
    return export_data


@router.post("/theme/import")
async def import_theme(
    theme_data: Dict[str, Any],
    org_id: int = Query(..., description="Organization ID")
):
    """Import theme configuration"""
    try:
        # Extract theme data from import
        theme_update = ThemeUpdate(
            logo_url=theme_data.get("logo_url"),
            primary_color=theme_data.get("primary_color"),
            accent_color=theme_data.get("accent_color"),
            secondary_color=theme_data.get("secondary_color"),
            typography=theme_data.get("typography"),
            footer_links=theme_data.get("footer_links"),
            company_name=theme_data.get("company_name"),
            contact_email=theme_data.get("contact_email")
        )
        
        # Validate imported data
        errors = branding_service.validate_theme_data(theme_update)
        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})
        
        # Create/update theme
        theme = branding_service.update_theme(org_id, theme_update)
        
        return {
            "status": "imported",
            "org_id": org_id,
            "theme": theme
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/theme/colors")
async def get_theme_colors(
    org_id: Optional[int] = Query(None, description="Organization ID")
):
    """Get theme colors for color picker"""
    theme = branding_service.get_theme(org_id)
    
    return {
        "primary_color": theme.primary_color,
        "accent_color": theme.accent_color,
        "secondary_color": theme.secondary_color,
        "suggested_colors": [
            "#1d4ed8", "#3b82f6", "#6366f1", "#8b5cf6",
            "#ec4899", "#f59e0b", "#ef4444", "#10b981",
            "#64748b", "#475569", "#334155", "#1e293b"
        ]
    }


@router.get("/theme/fonts")
async def get_available_fonts():
    """Get available fonts for typography"""
    return {
        "fonts": [
            {
                "name": "Inter",
                "value": "Inter, system-ui, sans-serif",
                "category": "Sans-serif"
            },
            {
                "name": "Roboto",
                "value": "Roboto, system-ui, sans-serif",
                "category": "Sans-serif"
            },
            {
                "name": "Open Sans",
                "value": "Open Sans, system-ui, sans-serif",
                "category": "Sans-serif"
            },
            {
                "name": "Lato",
                "value": "Lato, system-ui, sans-serif",
                "category": "Sans-serif"
            },
            {
                "name": "Poppins",
                "value": "Poppins, system-ui, sans-serif",
                "category": "Sans-serif"
            },
            {
                "name": "Merriweather",
                "value": "Merriweather, serif",
                "category": "Serif"
            },
            {
                "name": "Playfair Display",
                "value": "Playfair Display, serif",
                "category": "Serif"
            }
        ],
        "font_sizes": [
            "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"
        ],
        "font_weights": [
            {"name": "Normal", "value": "400"},
            {"name": "Medium", "value": "500"},
            {"name": "Semibold", "value": "600"},
            {"name": "Bold", "value": "700"}
        ]
    }
