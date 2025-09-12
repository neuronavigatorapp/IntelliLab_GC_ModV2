#!/usr/bin/env python3
"""
Instructor endpoints for IntelliLab GC API
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from app.models.schemas import (
    TrainingCourse, Enrollment, CreateCourse, UpdateCourse, AssignCourse,
    GradeOverride, EnrollmentStatus
)
from app.services.instructor_service import instructor_service

router = APIRouter()


@router.get("/courses", response_model=List[TrainingCourse])
async def list_courses(
    author: Optional[str] = Query(None, description="Filter by author")
):
    """List training courses"""
    courses = instructor_service.list_courses(author=author)
    return courses


@router.post("/courses", response_model=TrainingCourse)
async def create_course(
    course_data: CreateCourse,
    author: str = "System"  # In production, get from auth context
):
    """Create a new training course"""
    try:
        course = instructor_service.create_course(course_data, author)
        return course
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/courses/{course_id}", response_model=TrainingCourse)
async def get_course(course_id: int):
    """Get a specific training course"""
    course = instructor_service.courses.get(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return course


@router.put("/courses/{course_id}", response_model=TrainingCourse)
async def update_course(
    course_id: int,
    course_data: UpdateCourse
):
    """Update a training course"""
    course = instructor_service.update_course(course_id, course_data)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return course


@router.post("/courses/{course_id}/publish")
async def publish_course(course_id: int):
    """Publish a training course"""
    success = instructor_service.publish_course(course_id)
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return {"status": "published", "course_id": course_id}


@router.post("/courses/{course_id}/assign", response_model=List[Enrollment])
async def assign_course(
    course_id: int,
    assignment: AssignCourse
):
    """Assign a course to multiple users"""
    try:
        enrollments = instructor_service.assign_course(assignment)
        return enrollments
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/courses/{course_id}/enrollments", response_model=List[Enrollment])
async def get_course_enrollments(course_id: int):
    """Get all enrollments for a specific course"""
    enrollments = instructor_service.get_course_enrollments(course_id)
    return enrollments


@router.get("/users/{user_id}/enrollments", response_model=List[Enrollment])
async def get_user_enrollments(user_id: int):
    """Get all enrollments for a specific user"""
    enrollments = instructor_service.get_user_enrollments(user_id)
    return enrollments


@router.post("/attempts/{attempt_id}/override", response_model=Dict[str, Any])
async def override_grade(
    attempt_id: int,
    override_data: GradeOverride,
    instructor_id: int = 1  # In production, get from auth context
):
    """Override a grade for a training attempt"""
    attempt = instructor_service.override_grade(attempt_id, override_data, instructor_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    return {
        "attempt_id": attempt_id,
        "new_score": override_data.score,
        "reason": override_data.reason,
        "instructor_id": instructor_id,
        "timestamp": attempt.updated_date
    }


@router.get("/grade-overrides")
async def get_grade_overrides(
    course_id: Optional[int] = Query(None, description="Filter by course ID")
):
    """Get grade override history"""
    overrides = instructor_service.get_grade_overrides(course_id)
    return overrides


@router.get("/courses/{course_id}/analytics")
async def get_course_analytics(course_id: int):
    """Get analytics for a specific course"""
    analytics = instructor_service.get_course_analytics(course_id)
    if not analytics:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return analytics


@router.get("/courses/{course_id}/users/{user_id}/progress")
async def get_user_progress(course_id: int, user_id: int):
    """Get detailed progress for a specific user in a course"""
    progress = instructor_service.get_user_progress(user_id, course_id)
    if not progress:
        raise HTTPException(status_code=404, detail="User progress not found")
    
    return progress


@router.post("/courses/{course_id}/lessons/{lesson_id}")
async def add_lesson_to_course(
    course_id: int,
    lesson_id: int,
    position: Optional[int] = Query(None, description="Position in course (0-based)")
):
    """Add a lesson to a course at a specific position"""
    success = instructor_service.add_lesson_to_course(course_id, lesson_id, position)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to add lesson to course")
    
    return {"status": "added", "course_id": course_id, "lesson_id": lesson_id}


@router.delete("/courses/{course_id}/lessons/{lesson_id}")
async def remove_lesson_from_course(course_id: int, lesson_id: int):
    """Remove a lesson from a course"""
    success = instructor_service.remove_lesson_from_course(course_id, lesson_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to remove lesson from course")
    
    return {"status": "removed", "course_id": course_id, "lesson_id": lesson_id}


@router.put("/courses/{course_id}/lessons/reorder")
async def reorder_course_lessons(
    course_id: int,
    lesson_order: List[int]
):
    """Reorder lessons in a course"""
    success = instructor_service.reorder_course_lessons(course_id, lesson_order)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to reorder lessons")
    
    return {"status": "reordered", "course_id": course_id, "lesson_order": lesson_order}


@router.get("/enrollments/{enrollment_id}", response_model=Enrollment)
async def get_enrollment(enrollment_id: int):
    """Get a specific enrollment"""
    enrollment = instructor_service.enrollments.get(enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    return enrollment


@router.put("/enrollments/{enrollment_id}/status")
async def update_enrollment_status(
    enrollment_id: int,
    status: EnrollmentStatus
):
    """Update enrollment status"""
    enrollment = instructor_service.enrollments.get(enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    enrollment.status = status
    enrollment.updated_date = instructor_service._get_current_time()
    
    return {"status": "updated", "enrollment_id": enrollment_id, "new_status": status}


@router.get("/stats")
async def get_instructor_stats(instructor_id: int = 1):  # In production, get from auth context
    """Get instructor statistics"""
    # Calculate instructor stats
    instructor_courses = [c for c in instructor_service.courses.values() if c.author == "System"]  # Simplified
    
    total_courses = len(instructor_courses)
    published_courses = len([c for c in instructor_courses if c.published])
    
    # Total enrollments across all courses
    total_enrollments = 0
    active_enrollments = 0
    completed_enrollments = 0
    
    for course in instructor_courses:
        course_enrollments = instructor_service.get_course_enrollments(course.id)
        total_enrollments += len(course_enrollments)
        active_enrollments += len([e for e in course_enrollments if e.status == EnrollmentStatus.ACTIVE])
        completed_enrollments += len([e for e in course_enrollments if e.status == EnrollmentStatus.COMPLETED])
    
    # Average completion rate
    avg_completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0.0
    
    return {
        "total_courses": total_courses,
        "published_courses": published_courses,
        "total_enrollments": total_enrollments,
        "active_enrollments": active_enrollments,
        "completed_enrollments": completed_enrollments,
        "avg_completion_rate": avg_completion_rate,
        "instructor_id": instructor_id
    }


@router.get("/courses/{course_id}/export")
async def export_course_data(course_id: int):
    """Export course data for reporting"""
    course = instructor_service.courses.get(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    enrollments = instructor_service.get_course_enrollments(course_id)
    
    # Get all attempts for this course
    from app.services.training_service import training_service
    
    course_exercises = [e for e in training_service.exercises.values() 
                       if e.lesson_id in course.lessons_ordered_ids]
    exercise_ids = [e.id for e in course_exercises]
    
    course_attempts = [a for a in training_service.attempts.values() 
                      if a.exercise_id in exercise_ids]
    
    export_data = {
        "course": {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "author": course.author,
            "created_date": course.created_date,
            "updated_date": course.updated_date
        },
        "enrollments": [
            {
                "id": e.id,
                "user_id": e.user_id,
                "status": e.status,
                "progress_percentage": e.progress_percentage,
                "started_at": e.started_at,
                "completed_at": e.completed_at
            }
            for e in enrollments
        ],
        "attempts": [
            {
                "id": a.id,
                "user_id": a.user_id,
                "exercise_id": a.exercise_id,
                "score": a.score,
                "passed": a.passed,
                "submitted_at": a.submitted_at,
                "time_taken_sec": a.time_taken_sec
            }
            for a in course_attempts
        ],
        "export_date": instructor_service._get_current_time()
    }
    
    return export_data
